import type { Metadata } from "next";
import Link from "next/link";
import { display, mono, serif } from "../fonts";
import { PEOPLE } from "../people";
import styles from "./people.module.css";

export const metadata: Metadata = {
  title: "who we work with · nidas touch",
};

/* The people we make things with, each with their own links. Fully graded, nothing moving but the clips. */
export default function People() {
  return (
    <div className={`${display.variable} ${mono.variable} ${serif.variable} ${styles.page}`}>
      <header className={styles.top}>
        <Link href="/" className={styles.home}>nidas touch</Link>
        <Link href="/" className={styles.back}>go back</Link>
      </header>

      <main className={styles.main}>
        <h1>who we work with</h1>
        <p className={styles.lede}>a few of the people we make things with. more soon.</p>

        <ul className={styles.list}>
          {PEOPLE.map((p) => (
            <li key={p.id} className={styles.person}>
              <div className={styles.words}>
                <span className={styles.handle}>{p.handle}</span>
                <h2>{p.name}</h2>
                <p>{p.what} {p.together}</p>
                <p className={styles.links}>
                  {p.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.foot}>
        <span>© 2026 leonidas touch llc · san antonio, texas</span>
        <Link href="/">back to the studio</Link>
      </footer>
    </div>
  );
}
