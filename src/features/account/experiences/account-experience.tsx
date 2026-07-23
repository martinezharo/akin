"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AccountLoading } from "../components/account-loading";
import { GuestAccountPage } from "./guest-account-page";
import { RegisteredAccountPage } from "./registered-account-page";

export function AccountExperience() {
	return (
		<>
			<AuthLoading><AccountLoading /></AuthLoading>
			<Unauthenticated><GuestAccountPage /></Unauthenticated>
			<Authenticated><RegisteredAccountPage /></Authenticated>
		</>
	);
}
