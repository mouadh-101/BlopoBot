// auth.js

const fs = require("fs");
const { google } = require("googleapis");
require('dotenv').config();

const TOKEN_PATH = 'token.json';

class AuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    // Load existing token if available
    this.accessToken = null;
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      this.oauth2Client.setCredentials(token);
      this.accessToken = token.access_token;
    }
    this.authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/blogger '],
    });
  }

  getAuthUrl() {
    return this.authUrl;
  }

  async setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
    this.accessToken = tokens.access_token;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  }
}

module.exports = new AuthService();



