# FeediSight - LinkedIn Content Optimization Platform

A comprehensive AI-powered platform for LinkedIn content optimization using **AWS Bedrock API with Microsoft Semantic Kernel + AutoGen**. Generate, analyze, optimize, and predict the performance of LinkedIn posts with our multi-agent AI system.

## 📚 Documentation

- **[requirements.md](requirements.md)** - Comprehensive requirements and feature documentation
- **[design.md](design.md)** - System architecture and technical design

## Features

- **AI-Powered Post Generation** - Interactive chatbot and structured generation using AWS Bedrock API with Microsoft Semantic Kernel + AutoGen
- **Multi-Agent Analysis** - 5 specialized AI agents analyze every aspect of your posts
- **Viral Post Learning** - Learn from high-performing LinkedIn content patterns
- **Smart Optimization** - Transform average posts into viral content
- **Engagement Prediction** - Predict performance before publishing
- **Comprehensive Analytics** - Track performance and gain insights
- **Draft Management** - Save, edit, and schedule posts

## Tech Stack

### Backend
- Django 4.2+ with Django REST Framework
- MongoDB Atlas
- Qdrant for vector storage
- AWS Bedrock for AI models

### Frontend
- React 18+ with TypeScript
- Tailwind CSS 3+
- Redux Toolkit
- React Router v6
- Recharts for data visualization
- Axios for API calls

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- MongoDB Atlas account (for development) or AWS DocumentDB (for production)
- AWS Account with Bedrock access
- LibreOffice (for Excel file processing)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd linkedin_project
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

5. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables:
     - AWS credentials and Bedrock configuration
     - MongoDB connection string
     - PostgreSQL database credentials
     - Redis connection details
     - MinIO/S3 storage credentials

6. Start the Docker services:
   ```bash
   docker-compose up -d
   ```

7. Run database migrations:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py init_timescaledb
   python manage.py create_qdrant_collections
   ```

8. Start Celery workers (in separate terminals):
   ```bash
   cd backend
   celery -A config worker -l info
   celery -A config beat -l info
   ```

9. Start the development servers:
   - Backend:
     ```bash
     python manage.py runserver
     ```
   - Frontend:
     ```bash
     cd ../frontend
     npm run dev
     ```

## Development

### Backend Development
- The Django admin interface is available at `http://localhost:8000/admin/`
- API documentation is available at `http://localhost:8000/api/docs/`
- Run tests with `python manage.py test`
- Monitor Celery tasks in the logs

### Frontend Development
- Development server runs at `http://localhost:5173` (Vite default)
- Run tests with `npm test`
- Build production bundle with `npm run build`

## Key Features

### 🤖 AI Post Generation
- Interactive AI chatbot for post creation
- Multiple tone and style options
- Viral post pattern learning
- Context-aware content generation

### 📊 Analytics Dashboard
- Real-time performance tracking
- Engagement metrics visualization
- Follower growth analysis
- Visitor demographics
- Time-series data with TimescaleDB

### 🔍 Post Analysis
- Multi-agent AI analysis system
- Engagement prediction
- Content optimization suggestions
- Viral potential scoring

### 📤 Data Management
- Excel file upload and processing
- Incremental data updates
- LibreOffice-based file repair
- Automated data synchronization

## Architecture

The platform uses a microservices-inspired architecture with:
- **Django REST API** for backend services
- **React SPA** for the frontend
- **Celery** for asynchronous task processing
- **MongoDB** for analytics data storage
- **PostgreSQL** with TimescaleDB for time-series data
- **Qdrant** for vector similarity search
- **AWS Bedrock** for AI model inference

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with AWS Bedrock, Microsoft Semantic Kernel, and AutoGen for advanced AI capabilities.
