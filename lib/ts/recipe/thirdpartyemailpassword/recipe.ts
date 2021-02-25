/* Copyright (c) 2021, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
import RecipeModule from "../../recipeModule";
import { NormalisedAppinfo, APIHandled, RecipeListFunction } from "../../types";
import EmailVerificationRecipe from "../emailverification/recipe";
import EmailPasswordRecipe from "../emailpassword/recipe";
import ThirdPartyRecipe from "../thirdparty/recipe";
import * as express from "express";
import STError from "./error";
import { send200Response } from "../../utils";
import { TypeInput, TypeNormalisedInput, User } from "./types";
import {
    validateAndNormaliseUserInput,
    createNewPaginationToken,
    combinePaginationTokens,
    extractPaginationTokens,
    combinePaginationResults,
} from "./utils";
import {
    SIGN_UP_API,
    SIGN_IN_API,
    GENERATE_PASSWORD_RESET_TOKEN_API,
    PASSWORD_RESET_API,
    SIGN_OUT_API,
    SIGNUP_EMAIL_EXISTS_API,
} from "../emailpassword/constants";
import { SIGN_IN_UP_API, AUTHORISATION_API } from "../thirdparty/constants";
import signUpAPI from "../emailpassword/api/signup";
import signInAPI from "../emailpassword/api/signin";
import generatePasswordResetTokenAPI from "../emailpassword/api/generatePasswordResetToken";
import passwordResetAPI from "../emailpassword/api/passwordReset";
import signOutAPI from "../emailpassword/api/signout";
import emailExistsAPI from "../emailpassword/api/emailExists";
import signInUpAPI from "../thirdparty/api/signinup";
import authorisationUrlAPI from "../thirdparty/api/authorisationUrl";
import STErrorEmailPassword from "../emailpassword/error";
import STErrorThirdParty from "../thirdparty/error";

export default class Recipe extends RecipeModule {
    private static instance: Recipe | undefined = undefined;
    static RECIPE_ID = "thirdpartyemailpassword";

    config: TypeNormalisedInput;

    emailVerificationRecipe: EmailVerificationRecipe;

    emailPasswordRecipe: EmailPasswordRecipe;

    thirdPartyRecipe: ThirdPartyRecipe | undefined;

    constructor(recipeId: string, appInfo: NormalisedAppinfo, config: TypeInput) {
        super(recipeId, appInfo);
        this.config = validateAndNormaliseUserInput(this, appInfo, config);

        this.emailPasswordRecipe = EmailPasswordRecipe.init({
            sessionFeature: {
                setJwtPayload: async (user, formfields, action) => {
                    return this.config.sessionFeature.setJwtPayload(
                        user,
                        {
                            loginType: "emailpassword",
                            formFields: formfields,
                        },
                        action
                    );
                },
                setSessionData: async (user, formfields, action) => {
                    return this.config.sessionFeature.setSessionData(
                        user,
                        {
                            loginType: "emailpassword",
                            formFields: formfields,
                        },
                        action
                    );
                },
            },
            signUpFeature: {
                disableDefaultImplementation: this.config.signUpFeature.disableDefaultImplementation,
                formFields: this.config.signUpFeature.formFields,
                handleCustomFormFieldsPostSignUp: async (user, formfields) => {
                    return await this.config.signUpFeature.handlePostSignUp(user, {
                        loginType: "emailpassword",
                        formFields: formfields,
                    });
                },
            },
            signInFeature: {
                disableDefaultImplementation: this.config.signInFeature.disableDefaultImplementation,
            },
            signOutFeature: {
                disableDefaultImplementation: this.config.signOutFeature.disableDefaultImplementation,
            },
            resetPasswordUsingTokenFeature: this.config.resetPasswordUsingTokenFeature,
            emailVerificationFeature: {
                disableDefaultImplementation: true,
            },
        })(appInfo) as EmailPasswordRecipe;

        this.thirdPartyRecipe = undefined;
        if (this.config.providers.length !== 0) {
            this.thirdPartyRecipe = ThirdPartyRecipe.init({
                sessionFeature: {
                    setJwtPayload: async (user, thirdPartyAuthCodeResponse, action) => {
                        return this.config.sessionFeature.setJwtPayload(
                            user,
                            {
                                loginType: "thirdparty",
                                thirdPartyAuthCodeResponse: thirdPartyAuthCodeResponse,
                            },
                            action
                        );
                    },
                    setSessionData: async (user, thirdPartyAuthCodeResponse, action) => {
                        return this.config.sessionFeature.setSessionData(
                            user,
                            {
                                loginType: "thirdparty",
                                thirdPartyAuthCodeResponse: thirdPartyAuthCodeResponse,
                            },
                            action
                        );
                    },
                },
                signInAndUpFeature: {
                    disableDefaultImplementation:
                        this.config.signInFeature.disableDefaultImplementation ||
                        this.config.signUpFeature.disableDefaultImplementation,
                    providers: this.config.providers,
                    handlePostSignUpIn: async (user, thirdPartyAuthCodeResponse, newUser) => {
                        if (newUser) {
                            return await this.config.signInFeature.handlePostSignIn(user, {
                                loginType: "thirdparty",
                                thirdPartyAuthCodeResponse,
                            });
                        } else {
                            return await this.config.signUpFeature.handlePostSignUp(user, {
                                loginType: "thirdparty",
                                thirdPartyAuthCodeResponse,
                            });
                        }
                    },
                },
                signOutFeature: {
                    disableDefaultImplementation: this.config.signOutFeature.disableDefaultImplementation,
                },
                emailVerificationFeature: {
                    disableDefaultImplementation: true,
                },
            })(appInfo) as ThirdPartyRecipe;
        }
        this.emailVerificationRecipe = new EmailVerificationRecipe(
            recipeId,
            appInfo,
            this.config.emailVerificationFeature
        );
    }

    static init(config: TypeInput): RecipeListFunction {
        return (appInfo) => {
            if (Recipe.instance === undefined) {
                Recipe.instance = new Recipe(Recipe.RECIPE_ID, appInfo, config);
                return Recipe.instance;
            } else {
                throw new STError(
                    {
                        type: STError.GENERAL_ERROR,
                        payload: new Error(
                            "ThirdParty recipe has already been initialised. Please check your code for bugs."
                        ),
                    },
                    Recipe.RECIPE_ID
                );
            }
        };
    }

    static reset() {
        if (process.env.TEST_MODE !== "testing") {
            throw new STError(
                {
                    type: STError.GENERAL_ERROR,
                    payload: new Error("calling testing function in non testing env"),
                },
                Recipe.RECIPE_ID
            );
        }
        Recipe.instance = undefined;
    }

    static getInstanceOrThrowError(): Recipe {
        if (Recipe.instance !== undefined) {
            return Recipe.instance;
        }
        throw new STError(
            {
                type: STError.GENERAL_ERROR,
                payload: new Error("Initialisation not done. Did you forget to call the SuperTokens.init function?"),
            },
            Recipe.RECIPE_ID
        );
    }

    getAPIsHandled = (): APIHandled[] => {
        let apisHandled = [
            ...this.emailPasswordRecipe.getAPIsHandled(),
            ...this.emailVerificationRecipe.getAPIsHandled(),
        ];
        if (this.thirdPartyRecipe !== undefined) {
            apisHandled.push(...this.thirdPartyRecipe.getAPIsHandled());
        }
        return apisHandled;
    };

    handleAPIRequest = async (id: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (id === SIGN_UP_API) {
            return await signUpAPI(this.emailPasswordRecipe, req, res, next);
        } else if (id === SIGN_IN_API) {
            return await signInAPI(this.emailPasswordRecipe, req, res, next);
        } else if (id === GENERATE_PASSWORD_RESET_TOKEN_API) {
            return await generatePasswordResetTokenAPI(this.emailPasswordRecipe, req, res, next);
        } else if (id === SIGN_OUT_API) {
            return await signOutAPI(this.emailPasswordRecipe, req, res, next);
        } else if (id === PASSWORD_RESET_API) {
            return await passwordResetAPI(this.emailPasswordRecipe, req, res, next);
        } else if (id === SIGNUP_EMAIL_EXISTS_API) {
            return await emailExistsAPI(this.emailPasswordRecipe, req, res, next);
        }
        if (this.thirdPartyRecipe !== undefined && id === SIGN_IN_UP_API) {
            return await signInUpAPI(this.thirdPartyRecipe, req, res, next);
        } else if (this.thirdPartyRecipe !== undefined && id === AUTHORISATION_API) {
            return await authorisationUrlAPI(this.thirdPartyRecipe, req, res, next);
        } else {
            return await this.emailVerificationRecipe.handleAPIRequest(id, req, res, next);
        }
    };

    handleError = (
        err: STErrorEmailPassword | STErrorThirdParty,
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): void => {
        if (err.type === STErrorEmailPassword.EMAIL_ALREADY_EXISTS_ERROR) {
            return this.handleError(
                new STErrorEmailPassword(
                    {
                        type: STErrorEmailPassword.FIELD_ERROR,
                        payload: [
                            {
                                id: "email",
                                error: "This email already exists. Please sign in instead.",
                            },
                        ],
                        message: "Error in input formFields",
                    },
                    this.getRecipeId()
                ),
                request,
                response,
                next
            );
        } else if (err.type === STErrorEmailPassword.WRONG_CREDENTIALS_ERROR) {
            return send200Response(response, {
                status: "WRONG_CREDENTIALS_ERROR",
            });
        } else if (err.type === STErrorEmailPassword.FIELD_ERROR) {
            return send200Response(response, {
                status: "FIELD_ERROR",
                formFields: err.payload,
            });
        } else if (err.type === STErrorEmailPassword.RESET_PASSWORD_INVALID_TOKEN_ERROR) {
            return send200Response(response, {
                status: "RESET_PASSWORD_INVALID_TOKEN_ERROR",
            });
        } else if (err.type === STErrorThirdParty.NO_EMAIL_GIVEN_BY_PROVIDER) {
            return send200Response(response, {
                status: "NO_EMAIL_GIVEN_BY_PROVIDER",
            });
        }
        return this.emailVerificationRecipe.handleError(err, request, response, next);
    };

    getAllCORSHeaders = (): string[] => {
        return [...this.emailVerificationRecipe.getAllCORSHeaders()];
    };

    signUp = async (email: string, password: string): Promise<User> => {
        return this.emailPasswordRecipe.signUp(email, password);
    };

    signIn = async (email: string, password: string): Promise<User> => {
        return this.emailPasswordRecipe.signIn(email, password);
    };

    signInUp = async (
        thirdPartyId: string,
        thirdPartyUserId: string,
        email: {
            id: string;
            isVerified: boolean;
        }
    ): Promise<{ createdNewUser: boolean; user: User }> => {
        if (this.thirdPartyRecipe === undefined) {
            throw new STError(
                {
                    type: STError.BAD_INPUT_ERROR,
                    message: "No thirdparty provider configured",
                },
                this.getRecipeId()
            );
        }
        return this.thirdPartyRecipe.signInUp(thirdPartyId, thirdPartyUserId, email);
    };

    getUserById = async (userId: string): Promise<User | undefined> => {
        let user: User | undefined = await this.emailPasswordRecipe.getUserById(userId);
        if (user !== undefined) {
            return user;
        }
        if (this.thirdPartyRecipe === undefined) {
            return undefined;
        }
        return await this.thirdPartyRecipe.getUserById(userId);
    };

    getUserByThirdPartyInfo = async (thirdPartyId: string, thirdPartyUserId: string): Promise<User | undefined> => {
        if (this.thirdPartyRecipe === undefined) {
            return undefined;
        }
        return this.thirdPartyRecipe.getUserByThirdPartyInfo(thirdPartyId, thirdPartyUserId);
    };

    getEmailForUserId = async (userId: string) => {
        let userInfo = await this.getUserById(userId);
        if (userInfo === undefined) {
            throw new STError(
                {
                    type: STError.UNKNOWN_USER_ID_ERROR,
                    message: "Unknown User ID provided",
                },
                this.getRecipeId()
            );
        }
        return userInfo.email;
    };

    getUserByEmail = async (email: string): Promise<User | undefined> => {
        return this.emailPasswordRecipe.getUserByEmail(email);
    };

    createResetPasswordToken = async (userId: string): Promise<string> => {
        return this.emailPasswordRecipe.createResetPasswordToken(userId);
    };

    resetPasswordUsingToken = async (token: string, newPassword: string) => {
        return this.emailPasswordRecipe.resetPasswordUsingToken(token, newPassword);
    };

    createEmailVerificationToken = async (userId: string): Promise<string> => {
        return this.emailVerificationRecipe.createEmailVerificationToken(userId, await this.getEmailForUserId(userId));
    };

    verifyEmailUsingToken = async (token: string) => {
        return this.emailVerificationRecipe.verifyEmailUsingToken(token);
    };

    isEmailVerified = async (userId: string) => {
        return this.emailVerificationRecipe.isEmailVerified(userId, await this.getEmailForUserId(userId));
    };

    getUsersOldestFirst = async (limit?: number, nextPaginationToken?: string) => {
        limit = limit === undefined ? 100 : limit;
        let nextPaginationTokens: {
            thirdPartyPaginationToken: string | undefined;
            emailPasswordPaginationToken: string | undefined;
        } = {
            thirdPartyPaginationToken: undefined,
            emailPasswordPaginationToken: undefined,
        };
        if (nextPaginationToken !== undefined) {
            nextPaginationTokens = extractPaginationTokens(this, nextPaginationToken);
        }
        let emailPasswordResultPromise = this.emailPasswordRecipe.getUsersOldestFirst(
            limit,
            nextPaginationTokens.emailPasswordPaginationToken
        );
        let thirdPartyResultPromise =
            this.thirdPartyRecipe === undefined
                ? {
                      users: [],
                  }
                : this.thirdPartyRecipe.getUsersOldestFirst(limit, nextPaginationTokens.thirdPartyPaginationToken);
        let emailPasswordResult = await emailPasswordResultPromise;
        let thirdPartyResult = await thirdPartyResultPromise;
        return combinePaginationResults(thirdPartyResult, emailPasswordResult, limit, true);
    };

    getUsersNewestFirst = async (limit?: number, nextPaginationToken?: string) => {
        limit = limit === undefined ? 100 : limit;
        let nextPaginationTokens: {
            thirdPartyPaginationToken: string | undefined;
            emailPasswordPaginationToken: string | undefined;
        } = {
            thirdPartyPaginationToken: undefined,
            emailPasswordPaginationToken: undefined,
        };
        if (nextPaginationToken !== undefined) {
            nextPaginationTokens = extractPaginationTokens(this, nextPaginationToken);
        }
        let emailPasswordResultPromise = this.emailPasswordRecipe.getUsersNewestFirst(
            limit,
            nextPaginationTokens.emailPasswordPaginationToken
        );
        let thirdPartyResultPromise =
            this.thirdPartyRecipe === undefined
                ? {
                      users: [],
                  }
                : this.thirdPartyRecipe.getUsersNewestFirst(limit, nextPaginationTokens.thirdPartyPaginationToken);
        let emailPasswordResult = await emailPasswordResultPromise;
        let thirdPartyResult = await thirdPartyResultPromise;
        return combinePaginationResults(thirdPartyResult, emailPasswordResult, limit, false);
    };

    getUserCount = async () => {
        let promise1 = this.emailPasswordRecipe.getUserCount();
        let promise2 = this.thirdPartyRecipe !== undefined ? this.thirdPartyRecipe.getUserCount() : 0;
        return (await promise1) + (await promise2);
    };
}
