"use client"; // error boundaries must be client components

import { useEffect } from "react";
import { display, mono } from "./fonts";
import styles from "./service.module.css";

/*
  If anything on a studio page throws while rendering (a browser we didn't plan for, a script that didn't
  load), this shows instead of the browser's bare error page: a way to try again, and the email address,
  so nobody who wanted to reach us leaves with nothing.
*/

export default function StudioError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className={`${display.variable} ${mono.variable} ${styles.page}`}>
      <header className={styles.top}>
        {/* a full page load on purpose: a client-side navigation could run into the same error */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.home}>nidas touch</a>
      </header>
      <main className={styles.main}>
        <h1>something didn&apos;t load</h1>
        <p className={styles.lede}>
          that one&apos;s on us. try again, and if it keeps happening, write to us at{" "}
          <a href="mailto:hello@nidastouch.com">hello@nidastouch.com</a>.
        </p>
        <p className={styles.ask}>
          <button type="button" className={styles.back} onClick={() => unstable_retry()}>try again</button>
        </p>
      </main>
    </div>
  );
}
