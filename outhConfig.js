module.exports = {
    'facebookAuth' : {
        'clientID'      : '805856186862870',
        'clientSecret'  : 'f71b203d46e2a3b37ca3e2abb3ff7477',
        'callbackURL'     : 'http://localhost:3400/api/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email'

    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:3400/api/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '930205980963-8rebt19cufepg48pnflpnpt8j8i24sed.apps.googleusercontent.com',
        'clientSecret'     : 'gAoDzgHX7_PeoJkgju09Jfg2',
        'callbackURL'      : 'http://localhost:3400/api/auth/google/callback'
    }
};