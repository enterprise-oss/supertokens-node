/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
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
import * as express from "express";

export type TypeInput = {
    signUpFeature?: TypeInputSignUp;
    signInFeature?: TypeInputSignIn;
    resetPasswordUsingTokenFeature?: TypeInputResetPasswordUsingTokenFeature;
    sessionInterface?: TypeInputSessionInterface;
};

export type TypeNormalisedInput = {
    signUpFeature: TypeNormalisedInputSignUp;
    signInFeature: TypeNormalisedInputSignIn;
    resetPasswordUsingTokenFeature: TypeNormalisedInputResetPasswordUsingTokenFeature;
    sessionInterface: TypeNormalisedInputSessionInterface;
};

export type TypeInputSignUp = {
    disableDefaultImplementation?: boolean;
    formFields?: {
        id: string;
        validate?: (value: string) => Promise<string | undefined>;
        optional?: boolean;
    }[];
    handleCustomFormFields?: (user: User, formFields: { id: string; value: string }[]) => Promise<void>;
};

export type TypeInputSignIn = {
    disableDefaultImplementation?: boolean;
};

export type TypeNormalisedInputSignUp = {
    disableDefaultImplementation: boolean;
    formFields: {
        id: string;
        validate: (value: string) => Promise<string | undefined>;
        optional: boolean;
    }[];
    handleCustomFormFields: (user: User, formFields: { id: string; value: string }[]) => Promise<void>;
};

export type TypeNormalisedInputSignIn = {
    disableDefaultImplementation: boolean;
    formFields: {
        id: "email" | "password";
        validate: (value: string) => Promise<string | undefined>;
    }[];
};

export type TypeInputResetPasswordUsingTokenFeature = {
    disableDefaultImplementation?: boolean;
    getResetPasswordURL?: (user: User) => Promise<string>;
    createAndSendCustomEmail?: (user: User, passwordResetURLWithToken: string) => Promise<void>;
};

export type TypeNormalisedInputResetPasswordUsingTokenFeature = {
    disableDefaultImplementation: boolean;
    getResetPasswordURL: (user: User) => Promise<string>;
    createAndSendCustomEmail: (user: User, passwordResetURLWithToken: string) => Promise<void>;
    formFields: {
        id: "password";
        validate: (value: string) => Promise<string | undefined>;
    }[];
};

export type TypeInputSessionInterface = {
    createNewSession?: (
        userId: string,
        from: "SIGN_UP" | "SIGN_IN",
        req: express.Request,
        res: express.Response
    ) => Promise<any>;
    verifySession?: (req: express.Request, res: express.Response) => Promise<string>;
    revokeSession?: (userId: string, req: express.Request, res: express.Response) => void;
};

export type TypeNormalisedInputSessionInterface = {
    createNewSession: (
        userId: string,
        from: "SIGN_UP" | "SIGN_IN",
        req: express.Request,
        res: express.Response
    ) => Promise<any>;
    verifySession: (req: express.Request, res: express.Response) => Promise<string>;
    revokeSession: (userId: string, req: express.Request, res: express.Response) => void;
};

export type User = {
    id: string;
    email: string;
};
