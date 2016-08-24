# passport-predix-jwt
[Passport](http://passportjs.org) strategy for validating JWTs issued from Predix UAA instances.

This strategy validates a JWT passed as a bearer token in the Authorization header against a specified UAA instance 
and is targeted at protecting API endpoints served by Node.JS applications.
There is currently one strategy completed, RemoteValidationStrategy, with a LocalValidationStrategy on the roadmap.

The RemoteValidationStrategy authenticates by checking the token against the app's cache or UAA's `check_token` endpoint.
Remote validation adds additional requests against your auth server, but lets you validate if the token has been revoked.
For more information [see the Predix UAA docs](https://www.predix.io/docs/#ZpStyvy5).

## Installation
```bash
npm install --save https://github.com/tim-hutchinson/passport-predix-jwt.git
```

## Usage

### RemoteValidationStrategy
 
#### Configure strategy


The strategy expects 1 of 2 options to be set:

- `uaaServiceName` - The name of the UAA service bound to your app in CloudFoundry. By using service discovery, you can easily change UAA instances without changing your application (recommended).
- `issuer` - The IssuerId URI of your UAA service, as a string. Ex: `https://46995891-525c-41a3-b46b-a31e93db2eeb.predix-uaa.run.asv-pr.ice.predix.io/oauth/token`

```js
var passport = require('passport');
var PredixRemoteJWTStrategy = require('passport-predix-jwt').RemoteValidationStrategy;

passport.use(new PredixRemoteJWTStrategy({
        uaaServiceName: 'uaa'
    }, 
    function (jwt_payload, done) {
        // Get a user record and call it back
        var user = Users.findByToken(jwt_payload);
        done(null, user);
    }
));
```

#### Authenticating Users
Use `passport.authenticate()`, specifying the `predix-remote-jwt` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/example', passport.authenticate('predix-remote-jwt'));

```