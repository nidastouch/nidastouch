import Link from "next/link";
import { display, mono } from "./fonts";
import styles from "./service.module.css";

/*
  The other services, each on its own plain page so Leo can send someone straight to it.
  No camera, no sounds, no log: someone booking a notary just wants the details.
*/

export type Block = { head: string; body: React.ReactNode };

export default function ServicePage({ title, lede, blocks, ask }: {
  title: string;
  lede: string;
  blocks: Block[];
  ask: { subject: string; line: string };
}) {
  return (
    <div className={`${display.variable} ${mono.variable} ${styles.page}`}>
      <header className={styles.top}>
        <Link href="/" className={styles.home}>nidas touch</Link>
        <Link href="/" className={styles.back}>go back</Link>
      </header>
      <main className={styles.main}>
        <h1>{title}</h1>
        <p className={styles.lede}>{lede}</p>
        <dl className={styles.blocks}>
          {blocks.map((b) => (
            <div key={b.head}>
              <dt>{b.head}</dt>
              <dd>{b.body}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.ask}>
          {ask.line}{" "}
          <a href={`mailto:hello@nidastouch.com?subject=${encodeURIComponent(ask.subject)}`}>hello@nidastouch.com</a>
        </p>
      </main>
      <footer className={styles.foot}>
        <span>© 2026 leonidas touch llc · san antonio, texas</span>
        <Link href="/">back to the studio</Link>
      </footer>
    </div>
  );
}
