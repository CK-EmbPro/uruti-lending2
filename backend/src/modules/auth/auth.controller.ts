import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserSeedService } from './user-seed.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userSeedService: UserSeedService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully', schema: { type: 'object', properties: { access_token: { type: 'string' }, user: { type: 'object' } } } })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticates a user and returns JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', schema: { type: 'object', properties: { access_token: { type: 'string' }, user: { type: 'object' } } } })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Login attempt for:', loginDto.email);
      const result = await this.authService.login(loginDto);
      console.log('Login successful for:', loginDto.email);
      return result;
    } catch (error) {
      // Re-throw known exceptions (they already have proper status codes)
      if (error instanceof UnauthorizedException || error.status === 401) {
        console.log('Login failed - Invalid credentials for:', loginDto.email);
        throw error;
      }
      
      // Log unexpected errors with full details for debugging
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        email: loginDto.email,
        errorName: error.name,
        errorStatus: error.status,
      });
      
      // Re-throw the error (it should already be an InternalServerErrorException from the service)
      throw error;
    }
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieves the currently authenticated user from JWT token',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      return this.authService.getCurrentUser(userId);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all users (without passwords)',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll() {
    return this.authService.findAll();
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by ID (without password)',
  })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch('users/:id/roles')
  @ApiOperation({
    summary: 'Update user roles',
    description: 'Updates the roles assigned to a user',
  })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({ type: UpdateUserRolesDto })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @ApiResponse({ status: 401, description: 'User not found' })
  updateRoles(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserRolesDto,
  ) {
    return this.authService.updateUserRoles(id, updateDto.roles);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed default users',
    description: 'Creates default users for testing (admin, loan officer, manager, approver, user). Only seeds if no users exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default users seeded successfully',
  })
  async seedUsers() {
    await this.userSeedService.seedDefaultUsers();
    return { message: 'Default users seeded successfully' };
  }

  @Post('seed/force')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force seed users',
    description: 'Creates default users even if some users already exist. Skips existing users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users seeded successfully',
  })
  async seedUsersForce() {
    await this.userSeedService.seedUsersForce();
    return { message: 'Users seeded successfully' };
  }
}

