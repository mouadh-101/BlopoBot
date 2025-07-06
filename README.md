# 🤖 BlopoBot - AI-Powered Telegram Blogging Assistant

BlopoBot is an intelligent Telegram bot that helps you create and publish blog posts using AI. Simply send a topic to the bot, and it will generate a complete blog post with title, content, tags, and even a cover image, then publish it directly to your Blogger account.

## ✨ Features

- **AI-Powered Content Generation**: Uses Google's Gemini AI to create engaging blog posts
- **Telegram Bot Interface**: Easy-to-use chat interface for content creation
- **Automatic Image Generation**: Creates relevant cover images for your posts
- **Direct Blogger Integration**: Publishes posts directly to your Blogger account
- **Interactive Workflow**: Preview, edit, and regenerate content before publishing
- **Session Management**: Maintains conversation state for seamless editing

## 🏗️ Architecture

The application consists of several key components:

### Core Services

1. **AuthService** (`Services/AuthService.js`)
   - Handles Google OAuth2 authentication for Blogger API
   - Manages access tokens and credentials
   - Provides authentication URLs for user setup

2. **BloggerService** (`Services/BloggerService.js`)
   - Interfaces with Google Blogger API
   - Handles post creation and publishing
   - Manages blog metadata and labels

3. **GeminiService** (`Services/GeminiService`)
   - Integrates with Google Gemini AI for content generation
   - Creates blog posts with proper HTML formatting
   - Generates relevant cover images using AI
   - Uploads images to Cloudinary for hosting

### Main Application (`index.js`)

- **Express Server**: Handles OAuth2 callback routes
- **Telegram Bot**: Manages user interactions and content workflow
- **Session Management**: Tracks user conversations and article states
- **Content Processing**: Converts HTML to Telegram-friendly format

## 🔧 Prerequisites

Before setting up BlopoBot , you'll need:

1. **Google Cloud Project** with Blogger API enabled
2. **Telegram Bot Token** from @BotFather
3. **Google Gemini API Key**
4. **Cloudinary Account** for image hosting
5. **Blogger Account** with a blog created

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/mouadh-101/BlopoBot.git
cd BlopoBot
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Google OAuth2 Configuration
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:3000/oauth2callback

# Blogger Configuration
BLOGGER_BLOG_ID=your_blogger_blog_id

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=3000
```

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Blogger API v3**
4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add `http://localhost:3000/oauth2callback` to authorized redirect URIs
   - Copy the Client ID and Client Secret to your `.env` file

### 4. Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token to your `.env` file

### 5. Google Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### 6. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from the dashboard
3. Add them to your `.env` file

### 7. Blogger Blog ID

1. Go to your Blogger dashboard
2. Select your blog
3. The blog ID is in the URL: `https://www.blogger.com/blog/posts/`**`YOUR_BLOG_ID`**
4. Copy the blog ID to your `.env` file

### 8. Initial Authentication

1. Start the server: `npm run dev`
2. Visit `http://localhost:3000/auth` in your browser
3. Complete the Google OAuth2 flow
4. Your credentials will be saved in `token.json`

## 📱 Usage

### Starting the Bot

```bash
npm run dev
```

### Using the Telegram Bot

1. **Start a conversation**: Send `/start` to begin
2. **Create a post**: Send any topic or idea
3. **Review content**: The bot will show you the generated article
4. **Choose action**:
   - ✅ **Confirm & Publish**: Publishes the post to Blogger
   - 🔁 **Regenerate Article**: Creates a new version
   - 🖋️ **Edit Topic/Content**: Allows you to modify the topic
5. **Cancel anytime**: Use `/cancel` to reset the session

### Example Workflow

```
User: "The benefits of remote work"
Bot: 📝 Generating article for: "The benefits of remote work"

Bot: 📄 Here's your generated article:
     Title: "Unlocking Productivity: The Transformative Benefits of Remote Work"
     [Article content with formatting...]
     
     [✅ Confirm & Publish] [🔁 Regenerate Article] [🖋️ Edit Topic/Content]

User: [Clicks "✅ Confirm & Publish"]
Bot: 🖼️ Generating cover image...
     🚀 Publishing to Blogger...
     ✅ Published successfully!
```

## 🔄 API Endpoints

### OAuth2 Routes

- `GET /auth` - Initiates Google OAuth2 flow
- `GET /oauth2callback` - Handles OAuth2 callback and token storage

## 🛠️ Development

### Project Structure

```
bloggerBot/
├── index.js                 # Main application entry point
├── package.json            # Dependencies and scripts
├── token.json             # OAuth2 tokens (auto-generated)
├── .env                   # Environment variables (create this)
└── Services/
    ├── AuthService.js     # Google OAuth2 authentication
    ├── BloggerService.js  # Blogger API integration
    └── GeminiService      # AI content generation
```

### Key Dependencies

- **express**: Web server framework
- **node-telegram-bot-api**: Telegram bot integration
- **@google/genai**: Google Gemini AI API
- **googleapis**: Google APIs (Blogger, OAuth2)
- **cloudinary**: Image hosting and management

### Scripts

- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests (not implemented)

## 🔒 Security Considerations

- Store sensitive credentials in `.env` file (never commit to version control)
- The `token.json` file contains OAuth2 tokens - keep it secure
- Use HTTPS in production for OAuth2 redirect URIs
- Regularly rotate API keys and tokens

## 🚨 Troubleshooting

### Common Issues

1. **"TELEGRAM_BOT_TOKEN not set"**
   - Ensure your `.env` file contains the correct bot token

2. **OAuth2 authentication fails**
   - Verify your Google Cloud credentials
   - Check that redirect URI matches exactly
   - Ensure Blogger API is enabled

3. **Blogger posting fails**
   - Verify your blog ID is correct
   - Check that OAuth2 tokens are valid
   - Ensure your blog is public or you have proper permissions

4. **AI content generation fails**
   - Verify your Gemini API key is valid
   - Check API quota limits
   - Ensure proper internet connectivity

### Debug Mode

Enable detailed logging by adding to your `.env`:

```env
DEBUG=true
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the Google Cloud and Blogger API documentation
- Ensure all environment variables are properly configured

---

**Happy Blogging! 🚀** 