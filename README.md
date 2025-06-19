# JWT Authentication Next.js App

A Next.js web application with comprehensive JWT authentication system, designed to fix 401 Unauthorized errors and ensure proper cookie management across different environments including preview domains.

## Features

- **JWT Authentication**: Secure token-based authentication with httpOnly cookies
- **User Management**: Registration, login, logout functionality
- **Role-based Access**: Support for USER and ADMIN roles
- **Protected Routes**: Middleware-based route protection
- **Preview Domain Support**: Optimized cookie settings for preview environments
- **Comprehensive Logging**: Detailed logging for debugging authentication flow
- **Responsive UI**: Modern, responsive design with Tailwind CSS
- **Database Integration**: PostgreSQL with Prisma ORM

## Key Authentication Features

### 1. Cookie Settings
- Environment-aware cookie configuration
- Secure cookies for production and preview environments
- SameSite settings optimized for cross-origin scenarios
- Automatic domain handling

### 2. Token Management
- JWT token generation with proper payload structure
- Token verification with issuer/audience validation
- Automatic token refresh and validation
- Secure token storage in httpOnly cookies

### 3. API Endpoints
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/auth/me` - Get current user
- `/api/auth/logout` - User logout

### 4. Middleware Protection
- Route-based access control
- Token validation on protected routes
- Automatic redirects for unauthorized access
- Public route handling

## Environment Setup

1. **Database Setup**:
   ```bash
   # Copy environment variables
   cp .env.example .env
   
   # Update DATABASE_URL in .env
   DATABASE_URL="postgresql://username:password@localhost:5432/jwt_auth_db"
   ```

2. **JWT Secret**:
   ```bash
   # Add a secure JWT secret to .env
   JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Database Migration**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database management
npm run db:studio
```

## Authentication Flow

1. **Registration**: User creates account with email, password, name, and role
2. **Login**: User authenticates with email/password
3. **Token Generation**: JWT token created with user payload
4. **Cookie Setting**: Token stored in httpOnly cookie with environment-appropriate settings
5. **Route Protection**: Middleware validates token on protected routes
6. **User Verification**: `/api/auth/me` endpoint validates current session
7. **Logout**: Token cleared from cookies

## Debugging Features

### Comprehensive Logging
- All authentication steps are logged with prefixes like `[Login API]`, `[AuthContext]`, `[Middleware]`
- Token verification results and cookie information
- Request/response headers for debugging
- Environment-specific debug information

### Development Debug Panel
- Login page shows debug information in development mode
- Auth state, loading states, and current URL display
- Cookie information and token validation status

## Preview Domain Support

The application is specifically configured to work with preview domains like `caade9c05.preview.abacusai.app`:

- **Cookie Security**: Automatic detection of preview environment
- **SameSite Settings**: Configured for cross-origin scenarios
- **Domain Handling**: Automatic domain resolution for cookies
- **CORS Support**: Proper headers for preview environments

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Signed tokens with expiration
- **HttpOnly Cookies**: Prevents XSS attacks
- **CSRF Protection**: SameSite cookie settings
- **Input Validation**: Zod schema validation
- **Error Handling**: Secure error messages

## File Structure

```
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── layout.tsx        # Root layout with AuthProvider
├── components/
│   ├── ui/               # Reusable UI components
│   ├── protected-route.tsx
│   └── user-menu.tsx
├── contexts/
│   └── AuthContext.tsx   # Authentication context
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database connection
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Route protection middleware
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized on /api/auth/me**:
   - Check cookie settings in browser dev tools
   - Verify JWT_SECRET is set correctly
   - Check middleware logs for token validation

2. **Cookies not being set**:
   - Verify cookie configuration for your environment
   - Check SameSite and Secure settings
   - Ensure domain compatibility

3. **Redirect loops**:
   - Check middleware logic for protected/public routes
   - Verify AuthContext state management
   - Check for conflicting redirects

### Debug Steps

1. Check browser console for detailed logs
2. Inspect Network tab for cookie headers
3. Verify database connection and user data
4. Test API endpoints directly
5. Check middleware execution order

## Production Deployment

1. Set environment variables:
   ```bash
   DATABASE_URL="your-production-database-url"
   JWT_SECRET="your-production-jwt-secret"
   NODE_ENV="production"
   ```

2. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

3. Run database migrations:
   ```bash
   npx prisma db push
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.# Build trigger - Thu Jun 19 12:11:09 UTC 2025
