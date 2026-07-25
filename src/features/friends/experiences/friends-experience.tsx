"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FriendsLoading } from "../components/friends-view";
import { RegisteredFriends } from "./registered-friends";

function SignedOutFriends() {
	const router = useRouter();

	// Friends need an account, so bounce home and let the gateway open auth there.
	useEffect(() => {
		router.replace("/?auth=friends");
	}, [router]);

	return <FriendsLoading />;
}

export function FriendsExperience() {
	return (
		<>
			<AuthLoading><FriendsLoading /></AuthLoading>
			<Unauthenticated><SignedOutFriends /></Unauthenticated>
			<Authenticated><RegisteredFriends /></Authenticated>
		</>
	);
}
