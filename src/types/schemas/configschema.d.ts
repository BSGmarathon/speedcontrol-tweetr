/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Uses the esa-layouts package to listen for a scene change event instead of a run change from speedcontrol
 */
export type UseTheEsaLayoutsPackageForObsEvents = boolean;
/**
 * An explanation about the purpose of this instance.
 */
export type TheApiKeySchema = string;
/**
 * An explanation about the purpose of this instance.
 */
export type TheApiSecretSchema = string;
/**
 * An explanation about the purpose of this instance.
 */
export type TheAccessTokenSchema = string;
/**
 * An explanation about the purpose of this instance.
 */
export type TheAccessTokenSecretSchema = string;

/**
 * The root schema comprises the entire JSON document.
 */
export interface Configschema {
	useEsaLayouts: UseTheEsaLayoutsPackageForObsEvents;
	useDummyTwitterClient: boolean;
	bluesky: {
		identifier: string;
		password: string;
		[k: string]: unknown;
	};
	obs: {
		gameLayout: string;
		[k: string]: unknown;
	};
	apiKey: TheApiKeySchema;
	apiSecret: TheApiSecretSchema;
	accessToken: TheAccessTokenSchema;
	accessTokenSecret: TheAccessTokenSecretSchema;
	[k: string]: unknown;
}
