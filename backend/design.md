# ViralPost AI - Design Document

## AWS AI for Bharat Hackathon Submission
**Problem Statement:** AI for Media, Content & Digital Experiences  
**Team Name:** HBT (Humming Bird Team)  
**Team Member:** [Your Name]

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Tailwind CSS + Redux Toolkit   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Nginx)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Django 4.2 + Django REST Framework                │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐  │  │
│  │  │  Post Gen  │  Analysis  │ Prediction │   Upload   │  │  │
│  │  │   Module   │   Module   │   Module   │   Module   │  │  │
│  │  └────────────┴────────────┴────────────┴────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ MongoDB  │  │  Redis   │  │   AWS    │
         │ Database │  │  Cache   │  │ Bedrock  │
         └──────────┘  └──────────┘  │   API    │
                                     └──────────┘
```

### 1.2 Component Architecture

#### Frontend Components
```
src/
├── pages/
│   ├── Dashboard/          # Main dashboard with analytics
│   ├── auth/              # Authentication pages
│   ├── posts/             # Post management
│   ├── analytics/         # Analytics views
│   ├── predictions/       # Engagement predictions
│   ├── recommendations/   # Content recommendations
│   └── onboarding/        # User onboarding flow
├── components/
│   ├── common/            # Reusable UI components
│   ├── charts/            # Data visualization
│   └── forms/             # Form components
└── services/
    ├── api/               # API client services
    └── utils/             # Utility functions
```

#### Backend Modules
```
backend/
├── apps/
│   ├── accounts/          # User authentication & management
│   ├── new_post/          # AI post generation
│   ├── post_analyser/     # Post analysis engine
│   ├── viralpost_scraping/# Viral content scraping
│   ├── post_comparison/   # Post comparison logic
│   ├── predictions/       # Engagement predictions
│   ├── recommendations/   # Content recommendations
│   ├── analytics/         # Analytics engine
│   ├── personal_story/    # User personalization
│   └── core/              # Shared utilities
└── config/
    ├── settings.py        # Django configuration
    └── urls.py            # URL routing
```

---

## 2. AI/ML Architecture

### 2.1 Multi-Agent AI System

The platform uses **AWS Bedrock API** to power a sophisticated multi-agent AI system:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Orchestrator                          │
│              (AWS Bedrock API Integration)                  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Content     │  │  Analysis    │  │  Prediction  │
│  Generation  │  │   Agents     │  │   Agents     │
│   Agents     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 2.2 AI Agents

#### 2.2.1 Content Generation Agents
- **LinkedIn Post Chatbot**
  - Purpose: Interactive conversational post creation
  - Technology: AWS Bedrock API with conversation memory
  - Features: Context awareness, tone adaptation, iterative refinement

- **Post Generator Agent**
  - Purpose: Structured post generation from topics
  - Technology: AWS Bedrock API with prompt engineering
  - Output: Hook, main content, CTA, hashtags, formatting

#### 2.2.2 Analysis Agents
- **Structure Analyzer Agent**
  - Analyzes: Hook quality, content flow, CTA effectiveness
  - Scores: Structure quality (0-100)
  - Recommendations: Specific improvements for each section

- **Hashtag Optimizer Agent**
  - Analyzes: Hashtag relevance, quantity, placement
  - Identifies: Trending hashtags, optimal count
  - Recommendations: Hashtag additions/removals

- **Keyword Optimizer Agent**
  - Analyzes: SEO keywords, search visibility
  - Identifies: Primary keywords, trending terms
  - Scores: Tone analysis (friendly, persuasive, formal)

- **Engagement Predictor Agent**
  - Analyzes: Engagement potential based on patterns
  - Predicts: Likes, comments, shares probability
  - Scores: Overall engagement score (0-100)

- **Tagging Strategy Agent**
  - Analyzes: People tagging opportunities
  - Identifies: Relevant influencers, collaborators
  - Recommendations: Strategic tagging suggestions

#### 2.2.3 Optimization Agent
- **Post Optimizer**
  - Input: Original post + analysis results
  - Process: Applies all agent recommendations
  - Output: Optimized post with improvements highlighted

#### 2.2.4 Comparison Agent
- **Viral Pattern Analyzer**
  - Compares: User post vs. viral posts
  - Identifies: Success patterns, gaps
  - Recommendations: Specific changes to emulate viral patterns

### 2.3 AI Workflow

#### Workflow 1: Post Generation
```
User Input (Topic, Context, Tone)
        ↓
AWS Bedrock API (Content Generation)
        ↓
Post Draft (Hook + Content + CTA)
        ↓
Auto-Analysis by Analysis Agents
        ↓
Optimized Post with Scores
```

#### Workflow 2: Post Analysis
```
User Post Content
        ↓
Parallel Analysis by 5 Agents
├── Structure Analyzer
├── Hashtag Optimizer
├── Keyword Optimizer
├── Engagement Predictor
└── Tagging Strategy Agent
        ↓
Aggregate Results + Virality Score
        ↓
Actionable Recommendations
```

#### Workflow 3: Post Optimization
```
Original Post + Analysis Results
        ↓
AWS Bedrock API (Optimization)
        ↓
Optimized Post
        ↓
Side-by-Side Comparison
        ↓
User Selection & Editing
```

---

## 3. Database Design

### 3.1 MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password_hash: String,
  profile_picture: String,
  oauth_providers: {
    google: { id: String, access_token: String },
    linkedin: { id: String, access_token: String }
  },
  created_at: DateTime,
  last_login: DateTime
}
```

#### Posts Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  content: String,
  media: [{
    type: String,  // 'image', 'video', 'gif'
    url: String,
    thumbnail: String
  }],
  hashtags: [String],
  status: String,  // 'draft', 'published', 'scheduled'
  virality_score: Number,
  analysis_data: {
    structure_score: Number,
    hashtag_score: Number,
    engagement_score: Number,
    keyword_score: Number,
    recommendations: [String]
  },
  created_at: DateTime,
  updated_at: DateTime,
  scheduled_at: DateTime
}
```

#### Viral Posts Collection
```javascript
{
  _id: ObjectId,
  post_id: String,
  author: String,
  author_profile: String,
  content: String,
  engagement: {
    likes: Number,
    comments: Number,
    shares: Number
  },
  hashtags: [String],
  analysis_data: Object,
  scraped_at: DateTime,
  search_query: String
}
```

#### Personal Stories Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  role: String,
  interests: [String],
  topics: [String],
  industry: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Chat Sessions Collection
```javascript
{
  _id: ObjectId,
  session_id: String,
  user_id: ObjectId,
  user_identifier: String,  // For anonymous users
  title: String,
  messages: [{
    role: String,  // 'user' or 'assistant'
    content: String,
    timestamp: DateTime
  }],
  is_active: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Analytics Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  post_id: ObjectId,
  metrics: {
    impressions: Number,
    clicks: Number,
    engagement_rate: Number,
    best_performing_hashtags: [String]
  },
  timestamp: DateTime
}
```

---

## 4. API Design

### 4.1 Authentication APIs

```
POST   /api/auth/register/              # User registration
POST   /api/auth/login/                 # User login
POST   /api/auth/logout/                # User logout
POST   /api/auth/google/signin/         # Google OAuth
GET    /api/auth/google/callback/       # Google callback
POST   /api/auth/linkedin/signin/       # LinkedIn OAuth
GET    /api/auth/linkedin/callback/     # LinkedIn callback
POST   /api/auth/forgot-password/       # Password reset
```

### 4.2 Post Generation APIs

```
POST   /api/new_post/chat/              # Interactive chatbot
POST   /api/new_post/generate/          # Generate structured post
POST   /api/new_post/generate/quick/    # Quick post generation
POST   /api/new_post/generate/optimized-with-viral-pattern/  # Optimize with viral patterns
GET    /api/new_post/chat/history/      # Get chat history
POST   /api/new_post/chat/reset/        # Reset chat session
GET    /api/new_post/sessions/          # List chat sessions
```

### 4.3 Post Analysis APIs

```
POST   /api/post-analyser/analyze/      # Analyze user post
POST   /api/post-analyser/analyze-viral/ # Analyze viral post
GET    /api/post-analyser/health/       # Health check
```

### 4.4 Viral Post Scraping APIs

```
GET    /api/viralpost-scraping/linkedin-posts/  # Get viral posts
POST   /api/viralpost-scraping/scrape/          # Scrape new viral posts
GET    /api/viralpost-scraping/cache/stats/     # Cache statistics
DELETE /api/viralpost-scraping/cache/clear/     # Clear cache
GET    /api/viralpost-scraping/cache/<id>/      # Get cached analysis
DELETE /api/viralpost-scraping/cache/<id>/      # Delete cached analysis
```

### 4.5 Post Comparison APIs

```
POST   /api/post-comparison/compare/    # Compare posts
POST   /api/post-comparison/similarity/ # Calculate similarity
```

### 4.6 Predictions APIs

```
POST   /api/predictions/engagement/     # Predict engagement
GET    /api/predictions/forecast/       # Get engagement forecast
POST   /api/predictions/success/        # Predict post success
```

### 4.7 Recommendations APIs

```
GET    /api/recommendations/content/    # Get content suggestions
GET    /api/recommendations/hashtags/   # Get hashtag recommendations
GET    /api/recommendations/timing/     # Get optimal posting times
```

### 4.8 Analytics APIs

```
GET    /api/analytics/overview/         # Analytics overview
GET    /api/analytics/audience/         # Audience insights
GET    /api/analytics/content/          # Content analysis
GET    /api/analytics/hashtags/         # Hashtag performance
GET    /api/analytics/timeseries/       # Time series data
```

### 4.9 Personal Story APIs

```
POST   /api/personal-story/             # Create/update personal story
GET    /api/personal-story/             # Get personal story
DELETE /api/personal-story/             # Delete personal story
```

---

## 5. UI/UX Design

### 5.1 Design System

#### Color Palette
- **Primary:** `#0d569e` (LinkedIn Blue)
- **CTA:** `#ff6700` (Orange)
- **Text:** `#000000` (Black)
- **Background:** `#f5f5f5` (Light Gray)
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Amber)
- **Error:** `#ef4444` (Red)

#### Typography
- **Font Family:** Inter, Roboto, system fonts
- **Headings:** Bold, 24-48px
- **Body:** Regular, 14-16px
- **Captions:** Regular, 12-14px

#### Components
- **Buttons:** Rounded, shadow on hover
- **Cards:** White background, subtle shadow
- **Forms:** Clean inputs with validation
- **Charts:** Recharts with custom colors
- **Modals:** Centered overlay with backdrop

### 5.2 Key User Interfaces

#### 5.2.1 Dashboard
- **Layout:** Sidebar + Main Content
- **Sections:**
  - Analytics Overview (cards with metrics)
  - Recent Posts (list with status)
  - Quick Actions (generate, analyze, compare)
  - Performance Charts (engagement over time)

#### 5.2.2 Post Generation Interface
- **Layout:** Two-column (input + preview)
- **Features:**
  - Topic input field
  - Context textarea
  - Tone selector (dropdown)
  - Target audience input
  - Generate button
  - Real-time preview
  - Edit capabilities
  - Save as draft button

#### 5.2.3 Post Analysis Interface
- **Layout:** Single column with tabs
- **Tabs:**
  - AI Analysis (scores + recommendations)
  - Viral Comparison (side-by-side)
  - Optimization (original vs. optimized)
- **Features:**
  - Virality score gauge
  - Agent scores breakdown
  - Tone analysis chart
  - Keyword highlights
  - Copy buttons

#### 5.2.4 Viral Posts Browser
- **Layout:** Grid of post cards
- **Features:**
  - Search by topic
  - Filter by engagement
  - Post preview modal
  - Select for comparison
  - View full post button
  - Author profile link

#### 5.2.5 Analytics Dashboard
- **Layout:** Multi-section scrollable page
- **Sections:**
  - Overview (KPI cards)
  - Engagement Trends (line chart)
  - Hashtag Performance (bar chart)
  - Audience Insights (pie chart)
  - Content Analysis (table)

---

## 6. Security Design

### 6.1 Authentication & Authorization
- **JWT Tokens:** Secure token-based authentication
- **OAuth 2.0:** Google and LinkedIn integration
- **Password Hashing:** bcrypt with salt
- **Session Management:** Redis-based sessions
- **CORS:** Configured for frontend domain only

### 6.2 Data Security
- **Encryption:** HTTPS for all communications
- **Input Validation:** Server-side validation for all inputs
- **SQL Injection Prevention:** ORM-based queries
- **XSS Prevention:** Content sanitization
- **CSRF Protection:** Django CSRF tokens

### 6.3 API Security
- **Rate Limiting:** 100 requests/minute per user
- **API Keys:** For AWS Bedrock API
- **Request Validation:** Schema validation on all endpoints
- **Error Handling:** No sensitive data in error messages

---

## 7. Performance Optimization

### 7.1 Caching Strategy
- **Redis Cache:** 
  - Analysis results (24-hour TTL)
  - Viral posts (1-week TTL)
  - User sessions (1-day TTL)
- **Browser Cache:** Static assets (images, CSS, JS)
- **CDN:** For media files (future enhancement)

### 7.2 Database Optimization
- **Indexing:** 
  - User ID on all collections
  - Post ID for quick lookups
  - Created_at for time-based queries
- **Query Optimization:** Projection to fetch only needed fields
- **Connection Pooling:** MongoDB connection pool

### 7.3 Frontend Optimization
- **Code Splitting:** React lazy loading
- **Bundle Optimization:** Webpack tree shaking
- **Image Optimization:** WebP format, lazy loading
- **Memoization:** React.memo for expensive components

### 7.4 AI/ML Optimization
- **Batch Processing:** Group similar requests
- **Response Caching:** Cache AI responses by content hash
- **Async Processing:** Non-blocking AI calls
- **Timeout Handling:** 120-second timeout for AI operations

---

## 8. Deployment Architecture

### 8.1 Development Environment
```
Docker Compose:
├── Frontend (React Dev Server) - Port 3000
├── Backend (Django runserver) - Port 8000
├── MongoDB - Port 27017
└── Redis - Port 6379
```

### 8.2 Production Environment
```
Docker Compose:
├── Nginx (Reverse Proxy) - Port 80/443
│   ├── /api/* → Backend
│   └── /* → Frontend
├── Frontend (Nginx static files)
├── Backend (Gunicorn + Django) - 4 workers
├── MongoDB (Persistent volume)
└── Redis (Persistent volume)
```

### 8.3 Scaling Strategy
- **Horizontal Scaling:** Multiple backend containers
- **Load Balancing:** Nginx upstream configuration
- **Database Replication:** MongoDB replica set (future)
- **Caching Layer:** Redis cluster (future)

---

## 9. Monitoring & Logging

### 9.1 Application Logging
- **Django Logging:** INFO level for production
- **Error Tracking:** Detailed stack traces
- **API Logging:** Request/response logging
- **AI Logging:** AWS Bedrock API call tracking

### 9.2 Performance Monitoring
- **Response Times:** Track API latency
- **Error Rates:** Monitor 4xx/5xx responses
- **Cache Hit Rates:** Redis performance metrics
- **Database Queries:** Slow query logging

### 9.3 Health Checks
- **Backend Health:** `/api/post-analyser/health/`
- **Database Health:** Connection status check
- **Cache Health:** Redis ping
- **AI Service Health:** AWS Bedrock API status

---

## 10. Testing Strategy

### 10.1 Backend Testing
- **Unit Tests:** Django test framework
- **API Tests:** DRF test client
- **Integration Tests:** End-to-end API flows
- **AI Tests:** Mock AWS Bedrock responses

### 10.2 Frontend Testing
- **Component Tests:** React Testing Library
- **Integration Tests:** User flow testing
- **E2E Tests:** Cypress (future enhancement)

### 10.3 Performance Testing
- **Load Testing:** Apache JMeter
- **Stress Testing:** Concurrent user simulation
- **AI Performance:** Response time benchmarks

---

## 11. Data Flow Diagrams

### 11.1 Post Generation Flow
```
User → Frontend → API → Django View → AI Agent → AWS Bedrock
                                            ↓
User ← Frontend ← API ← Django View ← Response ← AWS Bedrock
                                            ↓
                                      MongoDB (Save Draft)
                                            ↓
                                      Redis (Cache Analysis)
```

### 11.2 Post Analysis Flow
```
User Post → Frontend → API → Analysis View
                                    ↓
                            Check Redis Cache
                                    ↓
                            Cache Hit? → Return Cached
                                    ↓ No
                            Parallel AI Agents (5)
                                    ↓
                            Aggregate Results
                                    ↓
                            Calculate Virality Score
                                    ↓
                            Cache in Redis
                                    ↓
                            Return to Frontend
```

### 11.3 Viral Post Scraping Flow
```
User Search → Frontend → API → Scraping Task
                                    ↓
                            Web Scraping (LinkedIn)
                                    ↓
                            AI Analysis (AWS Bedrock)
                                    ↓
                            Save to MongoDB
                                    ↓
                            Cache in Redis
                                    ↓
                            Return Results
```

---

## 12. Technology Stack Summary

### Frontend
- **Framework:** React 18.2
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 3.3
- **State Management:** Redux Toolkit 1.9
- **Routing:** React Router 6.11
- **Charts:** Recharts 2.5
- **HTTP Client:** Axios 1.4

### Backend
- **Framework:** Django 4.2
- **API:** Django REST Framework 3.14
- **Language:** Python 3.10
- **Database:** MongoDB 6.0
- **Cache:** Redis 7.0
- **AI/ML:** AWS Bedrock API
- **Authentication:** JWT, OAuth 2.0

### DevOps
- **Containerization:** Docker 24.0
- **Orchestration:** Docker Compose 2.18
- **Web Server:** Nginx 1.24
- **WSGI Server:** Gunicorn 20.1
- **Version Control:** Git

### External Services
- **AI Service:** AWS Bedrock API
- **OAuth Providers:** Google, LinkedIn
- **Future:** AWS S3 (media storage)

---

## 13. Innovation Highlights

### 13.1 Multi-Agent AI System
- **Innovation:** Five specialized AI agents working in parallel
- **Benefit:** Comprehensive analysis from multiple perspectives
- **Technology:** AWS Bedrock API with custom prompt engineering

### 13.2 Virality Score Algorithm
- **Innovation:** Proprietary algorithm combining multiple AI insights
- **Benefit:** Single metric for post quality assessment
- **Components:** Structure, hashtags, keywords, engagement, tagging

### 13.3 Real-Time Optimization
- **Innovation:** Instant post optimization with side-by-side comparison
- **Benefit:** Users see exactly what changed and why
- **Technology:** AWS Bedrock API with diff highlighting

### 13.4 Personalized Content Generation
- **Innovation:** AI learns from user's personal story
- **Benefit:** Generated content matches user's voice and industry
- **Technology:** Context-aware prompting with AWS Bedrock

### 13.5 Viral Pattern Learning
- **Innovation:** Scrapes and analyzes real viral posts
- **Benefit:** Recommendations based on proven success patterns
- **Technology:** Web scraping + AI pattern recognition

---

## 14. Future Enhancements

### Phase 2 (3-6 months)
- **Multi-Platform Support:** Twitter, Facebook, Instagram
- **Advanced Analytics:** ML-powered insights
- **Team Collaboration:** Multi-user workspaces
- **Content Calendar:** Visual scheduling interface
- **A/B Testing:** Test multiple post variations

### Phase 3 (6-12 months)
- **Mobile Apps:** iOS and Android native apps
- **Browser Extension:** Quick optimization from LinkedIn
- **API Marketplace:** Third-party integrations
- **White-Label:** Agency solutions
- **Real-Time Trends:** Live trend monitoring

### Phase 4 (12+ months)
- **Advanced ML Models:** Custom-trained models
- **Influencer Network:** Connect with influencers
- **Automated Posting:** AI-driven posting schedules
- **Video Content:** Video post optimization
- **Global Expansion:** Multi-language support

---

## 15. Conclusion

ViralPost AI represents a comprehensive, production-ready solution for LinkedIn content optimization. The design leverages cutting-edge AI technology (AWS Bedrock API) within a robust, scalable architecture. The multi-agent AI system, combined with intelligent caching and real-time analysis, provides users with unparalleled insights into their LinkedIn content performance.

The platform's modular design allows for easy feature additions and scaling, while the focus on user experience ensures that powerful AI capabilities remain accessible and intuitive. By combining post generation, analysis, optimization, and prediction in a single platform, ViralPost AI empowers users to create more engaging and effective LinkedIn content.

This design directly addresses the hackathon's challenge of creating an AI-driven solution for media and content creation, with strong emphasis on creativity, usability, and AI-enhanced workflows.
