import { argon2id, argon2Verify } from "hash-wasm";

const KDF_Params = {
    parallelism: 1,
    iterations: 3,
    memorySize: 64, // 64KB
    hashLength: 32,
    outputType: "encoded" // double check this later -- could break something
}

function createSalt(){
    // Builds a random salt value
    return crypto.getRandomValues(new Uint8Array(16))
}

async function buildRegistrationPayload(email, password) {
    const salt_auth = createSalt()
    const auth_key = await argon2id(
        {password: password,
        salt: salt_auth,
        ...KDF_Params,
        outputType: "hex"}
    )
    return {
        payload: {
            email,
            salt_auth,
            auth_key,
            kdf: {...KDF_Params}
        }
    }
}


export default buildRegistrationPayload