import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://keycloak:8080',
    realm: 'spotify-clone',
    clientId: 'spotify-frontend'
};

export const keycloak = new Keycloak(keycloakConfig);

let initPromise: Promise<boolean> | null = null;

export const initKeycloak = (): Promise<boolean> => {
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve, reject) => {
        try {
            const authenticated = keycloak.init({
                onLoad: 'check-sso',
                pkceMethod: 'S256',
                checkLoginIframe: true,
            });
            resolve(authenticated);
        } catch (error) {
            console.error('Keycloak initialization failed:', error);
            reject(error);
        }
    });
    return initPromise;
};
