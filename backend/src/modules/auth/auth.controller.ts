import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  Response,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { UserSeedService } from "./user-seed.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { JwtService } from "@nestjs/jwt";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userSeedService: UserSeedService,
    private readonly jwtService: JwtService
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register a new user",
    description: "Creates a new user account",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        user: { type: "object" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "User already exists" })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description:
      "Authenticates a user and returns JWT token in HttpOnly cookie",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        user: { type: "object" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async login(@Body() loginDto: LoginDto, @Response() res: any) {
    try {
      console.log("Login attempt for:", loginDto.email);
      const result = await this.authService.login(loginDto);
      console.log("Login successful for:", loginDto.email);

      // Set HttpOnly cookie with JWT token
      res.cookie("access_token", result.access_token, {
        httpOnly: true, // Prevent XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
      });

      // Also return token for backward compatibility (frontend can use cookie instead)
      return res.json(result);
    } catch (error) {
      // Re-throw known exceptions (they already have proper status codes)
      if (error instanceof UnauthorizedException || error.status === 401) {
        console.log("Login failed - Invalid credentials for:", loginDto.email);
        throw error;
      }

      // Log unexpected errors with full details for debugging
      console.error("Login error details:", {
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

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User logout",
    description: "Clears the authentication cookie",
  })
  @ApiResponse({ status: 200, description: "Logout successful" })
  async logout(@Response() res: any) {
    // Clear the HttpOnly cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({ message: "Logged out successfully" });
  }

  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user",
    description:
      "Retrieves the currently authenticated user from JWT token (cookie or Bearer header)",
  })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCurrentUser(
    @Headers("authorization") authHeader?: string,
    @Req() req?: any
  ) {
    // Log request details for debugging
    console.log("[Auth/Me] Request received:", {
      hasAuthHeader: !!authHeader,
      hasCookies: !!req?.cookies,
      cookieKeys: req?.cookies ? Object.keys(req.cookies) : [],
      hasAccessToken: !!req?.cookies?.access_token,
      timestamp: new Date().toISOString(),
    });

    let token: string | null = null;

    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("[Auth/Me] Token found in Authorization header");
    }

    // Fall back to cookie if no Bearer token
    if (!token && req?.cookies?.access_token) {
      token = req.cookies.access_token;
      console.log("[Auth/Me] Token found in cookie:", {
        tokenPrefix: token?.substring(0, 20),
      });
    }

    if (!token) {
      console.log(
        "[Auth/Me] No token found in headers or cookies - returning 401"
      );
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      console.log(
        "[Auth/Me] Token verified successfully, retrieving user:",
        userId
      );
      return this.authService.getCurrentUser(userId);
    } catch (error) {
      console.error("[Auth/Me] Token verification failed:", {
        message: error.message,
        name: error.name,
        tokenPrefix: token?.substring(0, 20),
      });
      throw new UnauthorizedException("Invalid token");
    }
  }

  @Get("users")
  @ApiOperation({
    summary: "Get all users",
    description: "Retrieves a list of all users (without passwords)",
  })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAll() {
    return this.authService.findAll();
  }

  @Get("users/:id")
  @ApiOperation({
    summary: "Get user by ID",
    description: "Retrieves a specific user by ID (without password)",
  })
  @ApiParam({ name: "id", description: "User UUID", type: String })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 401, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.authService.findOne(id);
  }

  @Patch("users/:id/roles")
  @ApiOperation({
    summary: "Update user roles",
    description: "Updates the roles assigned to a user",
  })
  @ApiParam({ name: "id", description: "User UUID", type: String })
  @ApiBody({ type: UpdateUserRolesDto })
  @ApiResponse({ status: 200, description: "User roles updated successfully" })
  @ApiResponse({ status: 401, description: "User not found" })
  updateRoles(@Param("id") id: string, @Body() updateDto: UpdateUserRolesDto) {
    return this.authService.updateUserRoles(id, updateDto.roles);
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Seed default users",
    description:
      "Creates default users for testing (admin, loan officer, manager, approver, user). Only seeds if no users exist.",
  })
  @ApiResponse({
    status: 200,
    description: "Default users seeded successfully",
  })
  async seedUsers() {
    await this.userSeedService.seedDefaultUsers();
    return { message: "Default users seeded successfully" };
  }

  @Post("seed/force")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Force seed users",
    description:
      "Creates default users even if some users already exist. Skips existing users.",
  })
  @ApiResponse({
    status: 200,
    description: "Users seeded successfully",
  })
  async seedUsersForce() {
    await this.userSeedService.seedUsersForce();
    return { message: "Users seeded successfully" };
  }
}
