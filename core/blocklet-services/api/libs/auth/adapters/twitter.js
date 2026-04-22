function Twitter(options) {
  const scope = ['users.read', 'tweet.read', 'offline.access', 'users.email'].join(' ');
  const fields = [
    // 'affiliation', // Metadata about a user's affiliation.
    'confirmed_email',
    // 'connection_status', // Returns detailed information about the relationship between two users.
    'created_at',
    'description', // The text of this User's profile description (also known as bio), if the User provided one.
    // 'entities', // A list of metadata found in the User's profile description.
    'id',
    'is_identity_verified',
    // 'location', // The location specified in the User's profile, if the User provided one. As this is a freeform value, it may not indicate a valid location, but it may be fuzzily evaluated when performing searches with location queries.
    // 'most_recent_tweet_id', // Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.
    'name',
    'parody',
    // 'pinned_tweet_id', // Unique identifier of this Tweet. This is returned as a string in order to avoid complications with languages and tools that cannot handle large integers.
    // 'profile_banner_url', // The URL to the profile banner for this User.
    'profile_image_url',
    'protected', // Indicates if this User has chosen to protect their Posts (in other words, if this User's Posts are private).
    // 'public_metrics', // A list of metrics for this User.
    // 'receives_your_dm', // Indicates if you can send a DM to this User
    // 'subscription',
    // 'subscription_type', // The X Blue subscription type of the user, eg: Basic, Premium, PremiumPlus or None. [Basic, Premium, PremiumPlus, None]
    'url', // The URL specified in the User's profile.
    'username',
    'verified', // Indicate if this User is a verified X User.
    'verified_followers_count',
    'verified_type', // The X Blue verified type of the user, eg: blue, government, business or none. [blue, government, business, none]
    // 'withheld', // Indicates withholding details for withheld content.
  ];
  return {
    id: 'twitter', // 保持跟其他 oauth 库一致，使用 twitter 作为 x 的识别号
    name: 'Twitter',
    type: 'oauth',
    checks: ['pkce', 'state'],
    authentication: 'basic',
    authorization: `https://x.com/i/oauth2/authorize?scope=${scope}&code_challenge=arcblock&code_challenge_method=plain`,
    token: 'https://api.x.com/2/oauth2/token',
    userinfo: `https://api.x.com/2/users/me?user.fields=${fields.join(',')}`,
    profile({ data: profile }) {
      const result = {
        sub: `twitter:${profile.id}`,
        name: profile.name,
        email: profile.confirmed_email ?? null,
        picture: profile.profile_image_url,
        emailVerified: Boolean(profile.confirmed_email),
        extraData: {
          username: profile.username,
          description: profile.description,
          parody: profile.parody,
          protected: profile.protected,
          verified: profile.verified,
          verified_type: profile.verified_type,
          created_at: profile.created_at,
          is_identity_verified: profile.is_identity_verified,
        },
      };
      return result;
    },
    options,
  };
}

module.exports = Twitter;
