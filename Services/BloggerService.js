// blogger.js

const { google } = require("googleapis");
const authService = require("./AuthService");

class BloggerService {

  blogger = google.blogger({ version: "v3", auth: authService.oauth2Client });

  async postToBlogger(title, content, tags = []) {
    try {
      const res = await this.blogger.posts.insert({
        blogId: process.env.BLOGGER_BLOG_ID,
        requestBody: {
          title,
          content,
          labels: tags
        }
      });

      console.log(`Posted: ${res.data.url}`);
      return res.data;
    } catch (err) {
      console.error("Error posting to Blogger:", err.message);
      throw err;
    }
  }
}

module.exports = new BloggerService();