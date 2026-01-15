import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.logger.debug(`Validating user with email: ${email}`);
      const user = await this.userRepository.findOne({ where: { email } });
      
      if (!user) {
        this.logger.debug(`User not found for email: ${email}`);
        throw new NotFoundException(`User not found`);
      }

      // Check if user has a password
      if (!user.password) {
        this.logger.warn(`User ${email} has no password set`);
        throw new BadRequestException('User account is missing password credentials');
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user: ${email}`);
        throw new BadRequestException('Invalid password provided');
      }

      const { password: _, ...result } = user;
      // Ensure roles is always an array (TypeORM simple-array might return string)
      if (result.roles) {
        const roles = result.roles as any;
        if (typeof roles === 'string') {
          result.roles = roles.split(',').map((r: string) => r.trim());
        } else if (!Array.isArray(roles)) {
          result.roles = ['user'];
        }
      }
      
      this.logger.debug(`User validated successfully: ${email}`);
      return result;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      // Check if it's a database connection error
      if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
        throw new InternalServerErrorException('Database connection failed. Please check your database configuration.');
      }
      // Check if it's a table not found error
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
        throw new InternalServerErrorException('Database table not found. Please run migrations or check database setup.');
      }
      throw new InternalServerErrorException(`Failed to validate user credentials: ${error.message}`);
    }
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      roles: registerDto.roles || ['user'],
      companyId: registerDto.companyId || null, // Set companyId if provided
    });

    const savedUser = await this.userRepository.save(user);

      // Generate JWT token with companyId for multi-tenancy
      const payload = {
        email: savedUser.email,
        sub: savedUser.id,
        roles: savedUser.roles,
        companyId: savedUser.companyId || null, // Include companyId in JWT
      };
      const access_token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    try {
      this.logger.debug(`Login attempt for email: ${loginDto.email}`);
      
      // Validate user credentials (throws specific exceptions if invalid)
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        // This should not happen now that validateUser throws
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.isActive === false) {
        this.logger.warn(`Login failed: Inactive account for ${loginDto.email}`);
        throw new UnauthorizedException('User account is inactive');
      }

      // Ensure roles is always an array
      const roles = Array.isArray(user.roles) 
        ? user.roles 
        : (typeof user.roles === 'string' 
          ? user.roles.split(',').map(r => r.trim()) 
          : ['user']);

      // Generate JWT token with companyId for multi-tenancy
      const payload = {
        email: user.email,
        sub: user.id,
        roles,
        companyId: user.companyId || null, // Include companyId in JWT
      };
      
      this.logger.debug(`Generating JWT token for user: ${user.email}, roles: ${JSON.stringify(roles)}`);
      
      let access_token: string;
      try {
        // Verify JWT service is properly configured
        if (!this.jwtService) {
          this.logger.error('JWT service is not initialized');
          throw new InternalServerErrorException('JWT service not configured');
        }
        
        access_token = this.jwtService.sign(payload);
        this.logger.debug('JWT token generated successfully');
      } catch (jwtError) {
        this.logger.error(`JWT signing error: ${jwtError.message}`, jwtError.stack);
        
        // Provide more specific error messages
        if (jwtError.message?.includes('secret') || jwtError.message?.includes('secretOrPrivateKey')) {
          throw new InternalServerErrorException('JWT secret not configured. Please set JWT_SECRET in your environment variables.');
        }
        
        throw new InternalServerErrorException(`Failed to generate authentication token: ${jwtError.message}`);
      }

      this.logger.log(`Login successful for user: ${user.email}`);
      
      return {
        access_token,
        user: { ...user, roles },
      };
    } catch (error) {
      // Re-throw known exceptions (don't wrap them)
      if (
        error instanceof UnauthorizedException || 
        error instanceof InternalServerErrorException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      
      // Log unexpected errors with full context
      this.logger.error(`Unexpected login error: ${error.message}`, error.stack);
      this.logger.error(`Error details: ${JSON.stringify({
        name: error.name,
        message: error.message,
        email: loginDto.email,
      })}`);
      
      throw new InternalServerErrorException(`Failed to process login request: ${error.message}`);
    }
  }

  async findAll(companyId?: string): Promise<Partial<User>[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId; // Filter by companyId for multi-tenancy
    }
    const users = await this.userRepository.find({
      where,
      select: ['id', 'email', 'name', 'roles', 'isActive', 'companyId', 'createdAt', 'updatedAt'],
    });
    return users;
  }

  async findOne(id: string, companyId?: string): Promise<Partial<User>> {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId; // Verify companyId for multi-tenancy
    }
    const user = await this.userRepository.findOne({
      where,
      select: ['id', 'email', 'name', 'roles', 'isActive', 'companyId', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateUserRoles(id: string, roles: string[]): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.roles = roles;
    const updatedUser = await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async getCurrentUser(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'roles', 'isActive', 'companyId', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}

