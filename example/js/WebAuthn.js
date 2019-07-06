$(document).ready(function () {

    // check whether current browser supports WebAuthn
    if (!window.PublicKeyCredential) {
        alert("Error: this browser does not support WebAuthn");
    }
});


SAFETECHioWebAuthnConfig = {
    registerBeginEndpoint: "",
    registerCompleteEndpoint: "",
    authenticateBeginEndpoint: "",
    authenticateCompleteEndpoint: "",
};

SAFETECHioWebAuthnConfig.registerBeginEndpoint += "RegisterBegin.php?username=";
SAFETECHioWebAuthnConfig.registerCompleteEndpoint += "RegisterComplete.php?username=";
SAFETECHioWebAuthnConfig.authenticateBeginEndpoint += "AuthenticateBegin.php?username=";
SAFETECHioWebAuthnConfig.authenticateCompleteEndpoint += "AuthenticationComplete.php?username=";

class SAFETECHioWebAuthn {

    constructor(config) {
        this.config = config;
    }

    // Base64 to ArrayBuffer
    static bufferDecode(value) {
        return Uint8Array.from(atob(value), c => c.charCodeAt(0));
    }

    // ArrayBuffer to URLBase64
    static bufferEncode(value) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }

    registerUser() {

        let username = $("#email").val();
        if (username === "") {
            alert("Please enter a username");
            return;
        }

        $.get(
            this.config.registerBeginEndpoint + username,
            null,
            function (data) {
                return data
            },
            'json'
        )
        .then((credentialCreationOptions) => {

            credentialCreationOptions.publicKey.challenge = SAFETECHioWebAuthn.bufferDecode(credentialCreationOptions.publicKey.challenge);
            credentialCreationOptions.publicKey.user.id = SAFETECHioWebAuthn.bufferDecode(credentialCreationOptions.publicKey.user.id);
            if (credentialCreationOptions.publicKey.excludeCredentials) {
                for (let i = 0; i < credentialCreationOptions.publicKey.excludeCredentials.length; i++) {
                    credentialCreationOptions.publicKey.excludeCredentials[i].id = SAFETECHioWebAuthn.bufferDecode(credentialCreationOptions.publicKey.excludeCredentials[i].id);
                }
            }

            return navigator.credentials.create({
                publicKey: credentialCreationOptions.publicKey
            });
        })
        .then((credential) => {

            let attestationObject = credential.response.attestationObject;
            let clientDataJSON = credential.response.clientDataJSON;
            let rawId = credential.rawId;

            let msg = JSON.stringify({
                id: credential.id,
                rawId: SAFETECHioWebAuthn.bufferEncode(rawId),
                type: credential.type,
                response: {
                    attestationObject: SAFETECHioWebAuthn.bufferEncode(attestationObject),
                    clientDataJSON: SAFETECHioWebAuthn.bufferEncode(clientDataJSON),
                },
            });

            return $.post(
                this.config.registerCompleteEndpoint + username,
                msg,
                function (data) {
                    return data
                },
                'json'
            )
        })
        .then((success) => {
            alert("successfully registered " + username + "!");
        })
        .catch((error) => {
            console.log(error);
            let err = JSON.parse(error.responseText);
            console.log(err);
            alert("failed to register '" + username + "'. \n error : " + err.error.message)
        })
    }

    authenticateUser() {
        let username = $("#email").val();
        if (username === "") {
            alert("Please enter a username");
            return;
        }

        $.get(
            this.config.authenticateBeginEndpoint + username,
            null,
            function (data) {
                return data
            },
            'json'
        )
        .then((credentialRequestOptions) => {

            credentialRequestOptions.publicKey.challenge = SAFETECHioWebAuthn.bufferDecode(credentialRequestOptions.publicKey.challenge);
            credentialRequestOptions.publicKey.allowCredentials.forEach(function (listItem) {
                listItem.id = SAFETECHioWebAuthn.bufferDecode(listItem.id)
            });

            return navigator.credentials.get({
                publicKey: credentialRequestOptions.publicKey
            })
        })
        .then((assertion) => {

            let authData = assertion.response.authenticatorData;
            let clientDataJSON = assertion.response.clientDataJSON;
            let rawId = assertion.rawId;
            let sig = assertion.response.signature;
            let userHandle = assertion.response.userHandle;

            let msg = JSON.stringify({
                id: assertion.id,
                rawId: SAFETECHioWebAuthn.bufferEncode(rawId),
                type: assertion.type,
                response: {
                    authenticatorData: SAFETECHioWebAuthn.bufferEncode(authData),
                    clientDataJSON: SAFETECHioWebAuthn.bufferEncode(clientDataJSON),
                    signature: SAFETECHioWebAuthn.bufferEncode(sig),
                    userHandle: SAFETECHioWebAuthn.bufferEncode(userHandle),
                },
            });

            return $.post(
                this.config.authenticateCompleteEndpoint + username,
                msg,
                function (data) {
                    return data
                },
                'json'
            )
        })
        .then((success) => {
            alert("successfully logged in " + username + "!");
        })
        .catch((error) => {
            console.log(error);
            let err = JSON.parse(error.responseText);
            console.log(err);
            alert("failed to register '" + username + "'. \n error : " + err.error.message)
        })
    }
}