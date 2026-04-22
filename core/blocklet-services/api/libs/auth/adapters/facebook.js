function Facebook(options) {
  return {
    id: 'facebook',
    name: 'Facebook',
    type: 'oauth',
    authorization: {
      url: 'https://www.facebook.com/v15.0/dialog/oauth',
      params: {
        scope: 'email',
      },
    },
    token: 'https://graph.facebook.com/oauth/access_token',
    userinfo: {
      // https://developers.facebook.com/docs/graph-api/reference/user/#fields
      url: 'https://graph.facebook.com/me?fields=id,name,email,picture',
      request({ tokens, provider }) {
        return fetch(provider.userinfo?.url, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }).then((res) => res.json());
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture.data.url,
      };
    },
    options,
  };
}

module.exports = Facebook;
