# Brawl Stars Discord Bot

A Discord bot that allows users to save their Brawl Stars profile, refresh their stats, and view leaderboards directly within Discord!

## Features

- **Save Profile Info**: Users can link their Brawl Stars tag to their Discord account.
- **Refresh Data**: Updates all user data with the latest Brawl Stars stats.
- **Leaderboard**: Displays top players ranked by credits.

## Commands

### `/saveinfo`

Save your Brawl Stars profile info.

**Usage:**

```
/saveinfo tag:YOUR_BRAWL_STARS_TAG
```

- Stores your tag, username, trophies, and credits.
- Prevents duplicate tags from being claimed by other users.
- Notifies the user upon successful registration.

### `/refresh`

Refreshes all user data.

**Usage:**

```
/refresh
```

- Updates all stored users' trophies and credits.
- Takes approximately 10 seconds per user.
- Displays a success or failure message.

### `/leaderboard`

Displays the top-ranked users sorted by credits.

**Usage:**

```
/leaderboard
```

- Shows ranks (🥇, 🥈, 🥉) for top players.
- Displays the associated Brawl Stars tag and fame level.
- Outputs results in a well-formatted embed.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/bilal-the-dev/Brawl-Stars-Discord-Bot.git
   cd your-repo
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your `.env` file with the required API keys and database URL.

```
TOKEN=OTXXXX.XXXXX.XXXXXXXXXXXXXXXXX
MONGO_URI=mongodb://localhost:27017/
BRAWL_STARS_API_BASE_URL=https://api.hpdevfox.ru
```

4. Set up your `config.json` file by copying contents from `sample.config.json`.

5. Start the bot:
   ```sh
   npm start
   ```

## Contributing

Contributions are welcome! Feel free to submit a pull request.
