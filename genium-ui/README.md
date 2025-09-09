# Genium UI

A modern React application built with Next.js, featuring AI-powered document analysis, code assistance, and user authentication via Auth0.

## Features

- **Document Q&A**: Upload documents and ask questions powered by AI
- **Code Assistance**: Get AI-powered code suggestions and improvements
- **User Authentication**: Secure login/logout with Auth0
- **Responsive Design**: Built with Tailwind CSS for mobile-first design
- **Dark Mode**: Theme switching support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Auth0 account for authentication
- Backend server (genium-backend) running

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd genium-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables in `.env.local`:
   ```env
   AUTH0_SECRET=your-auth0-secret
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
   ```

## Auth0 Setup

1. Create an Auth0 application:
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Create a new application (Single Page Application)
   - Set Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Set Allowed Logout URLs: `http://localhost:3000`

2. Get your credentials from the Auth0 dashboard and add them to `.env.local`

## Backend Setup

Ensure the genium-backend server is running on `http://localhost:5001`. Refer to the backend README for setup instructions.

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
genium-ui/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable components
│   ├── lib/              # Utility functions
│   └── pages/            # API routes
├── public/               # Static assets
├── .env.local            # Environment variables
└── next.config.js        # Next.js configuration
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

For deployment to platforms like Vercel, ensure all environment variables are set in your deployment environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
