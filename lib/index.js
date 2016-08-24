// Expose Strategy.
module.exports = {
    RemoteValidationStrategy: require('./remoteValidationStrategy'),
    LocalValidationStrategy: null // TODO: Implement a local JWT validation strategy
}
