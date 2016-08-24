/**
 * Module dependencies.
 */
var util = require('util'),
    Strategy = require('passport-strategy'),
    pft = require('predix-fast-token'),
    cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv();

/**
 * Strategy constructor
 *
 * @param options
 *          uaaServiceName: The name of a bound UAA service to validate against. Either this or issuer must be set.
 *          issuer: If uaaServiceName is not defined, the issuer to validate the token against.
 *          passReqToCallback: If true the, the verify callback will be called with args (request, jwt_payload, done_callback).
 * @param verify - Verify callback with args (jwt_payload, done_callback) if passReqToCallback is false,
 *                 (request, jwt_payload, done_callback) if true.
 */

function PredixRemoteJWTStrategy(options, verify) {
    if (typeof options == 'function') {
        verify = options;
        options = undefined;
    }
    options = options || {};
   
    // If the name of a bound UAA service is provided, pull details from that
    if (options.uaaServiceName) {
        uaaService = appEnv.getService(options.uaaServiceName)
        if (uaaService && uaaService.credentials) {
            options.issuer = uaaService.credentials.issuerId;
        }
        else {
            throw new Error("No bound UAA service matching " + options.uaaServiceName + " found");
        }
    }

    if (!options.issuer) {
        throw new Error("An issuer or a bound UAA service name must be provided.");
    }

    Strategy.call(this, options, verify);

    this.name = 'predix-remote-jwt';
    this._issuer = options.issuer;
    this._verify = verify;
}

util.inherits(PredixRemoteJWTStrategy, Strategy);

PredixRemoteJWTStrategy.prototype.authenticate = function (req, options) {
    var token = extractTokenFromRequest(req);
    var options = options || {};
    var self = this;
    
    if (!token) {
        // No token extracted from request
        self.fail("No token found in request", 401);
    }
    else {
        var issuers = [self._issuer] // TODO: Investigate what's in options
        pft.verify(token, issuers)
            .then(function (jwt_payload) {
                // Valid jwt, decoded
                var verifyCallback = function (err, user, info) {
                    if (err) {
                        return self.error(err);
                    }
                    if (!user) {
                        return self.fail(info);
                    }
                    self.success(user, info);
                };

                try {
                    if (self._passReqToCallback) {
                        self._verify(req, jwt_payload, verifyCallback);
                    }
                    else {
                        self._verify(jwt_payload, verifyCallback);
                    }
                } 
                catch (ex) {
                    self.error(ex);
                }
                self.success(jwt_payload);
            })
            .catch(function (err) {
                // Invalid JWT
                self.fail("JWT failed validation: " + err);
            });
    }
}

/**
 * Retrieve the JWT from a request. Looks for a Bearer token in the Authorization header.
 *
 * @param req The incoming request object
 * @returns The token from the header. Null if the token is not found.
 */
var extractTokenFromRequest = function (req) {
    const headerKey = 'Bearer';
    var token;
    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === headerKey) {
            token = parts[1];
        }
    }

    return token;
}

module.exports = PredixRemoteJWTStrategy;