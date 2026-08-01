"use client";

import { DEFAULT_PET_HAIR_ID, DEFAULT_PET_SKIN_ID } from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n";
import { petLookStyle } from "@/shared/ui/pet-look";
import { BadgeLadder } from "./components/badge-ladder";
import { CompanionPreview } from "./components/companion-preview";
import { CrewPreview } from "./components/crew-preview";
import { GithubLink } from "./components/github-link";
import { LandingActions } from "./components/landing-actions";
import { LandingHeader } from "./components/landing-header";
import { LiveCheckIn } from "./components/live-check-in";
import { PettableMascot } from "./components/pettable-mascot";
import styles from "./landing-page.module.css";

const copy = ui.landing;

/** The hero mascot is branding, so it never wears the visitor's own skin. */
const BRAND_LOOK = petLookStyle(DEFAULT_PET_SKIN_ID, DEFAULT_PET_HAIR_ID);

/**
 * The front door. It is deliberately built out of the app's own parts — the
 * badge, the portrait bubble, the wallet pill, the mascot — rather than out of
 * screenshots, so it can never advertise a version of Akin that no longer
 * exists.
 *
 * Everything here renders on the server except the hero card, which is the one
 * thing on the page a visitor can actually play with.
 */
export function LandingPage() {
	return (
		<div className={styles.page}>
			<a className={styles.skip} href="#start">{copy.skipToContent}</a>

			<LandingHeader />

			<main id="start">
				<section className={styles.hero}>
					<div className={styles.atmosphere} aria-hidden="true" />

					<div className={styles.heroCopy}>
						<p className={styles.eyebrow}>{copy.eyebrow}</p>
						<h1 className={styles.headline}>
							<span>{copy.headlineStart}</span>{" "}
							<span className={styles.accentWord}>{copy.headlineAccent}</span>{" "}
							<span>{copy.headlineEnd}</span>
						</h1>
						<p className={styles.subhead}>{copy.subhead}</p>
						<LandingActions className={styles.heroActions} />
					</div>

					{/* In front of the card, wearing the brand's colours rather than the
					    visitor's own saved skin — and pettable, like the real one. */}
					<div className={styles.heroStage}>
						<PettableMascot
							className={styles.heroMascot}
							viewBox="400 900 4216 3216"
							style={BRAND_LOOK}
							speechPlacement="left"
						/>
						<LiveCheckIn />
					</div>
				</section>

				<section className={styles.section}>
					<div className={styles.sectionHead}>
						<p className={styles.kicker}>{copy.ladder.kicker}</p>
						<h2 className={styles.title}>{copy.ladder.title}</h2>
						<p className={styles.lede}>{copy.ladder.copy}</p>
					</div>
					<BadgeLadder />
				</section>

				<section className={`${styles.section} ${styles.pair}`}>
					<article className={styles.card}>
						<p className={styles.kicker}>{copy.crew.kicker}</p>
						<h2 className={styles.cardTitle}>{copy.crew.title}</h2>
						<p className={styles.cardCopy}>{copy.crew.copy}</p>
						<CrewPreview />
					</article>

					<article className={styles.card}>
						<p className={styles.kicker}>{copy.companion.kicker}</p>
						<h2 className={styles.cardTitle}>{copy.companion.title}</h2>
						<p className={styles.cardCopy}>{copy.companion.copy}</p>
						<CompanionPreview />
					</article>
				</section>

				<section className={styles.honesty}>
					<div className={styles.honestyInner}>
						<p className={styles.kicker}>{copy.honesty.kicker}</p>
						<h2 className={styles.title}>{copy.honesty.title}</h2>
						<p className={styles.lede}>{copy.honesty.copy}</p>
					</div>
				</section>

				<section className={styles.closing}>
					<div className={styles.closingInner}>
						<h2 className={styles.closingTitle}>{copy.closingTitle}</h2>
						<p className={styles.closingCopy}>{copy.closingCopy}</p>
						<LandingActions className={styles.closingActions} />
					</div>
				</section>
			</main>

			<footer className={styles.footer}>
				<span className={styles.brandName}>{ui.metadata.title}</span>
				<span className={styles.footerNote}>{copy.footer}</span>
			</footer>

			<GithubLink />
		</div>
	);
}
