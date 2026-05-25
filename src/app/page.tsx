export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        textAlign: 'center',
        padding: 'var(--space-5)',
      }}
    >
      <img
        src="/logo.png"
        alt=""
        width={180}
        height={180}
        style={{
          width: 'clamp(120px, 18vw, 200px)',
          height: 'auto',
          marginBottom: 'var(--space-3)',
          filter: 'drop-shadow(0 8px 24px rgba(204, 0, 102, 0.3))',
        }}
      />
      <h1
        className="holo-text-3d"
        style={{
          fontSize: 'clamp(64px, 12vw, 128px)',
          margin: 0,
        }}
      >
        Sparkleware
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-italic)',
          fontStyle: 'italic',
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--purple-deep)',
          marginTop: 'var(--space-3)',
          maxWidth: '600px',
        }}
      >
        A holographic registry for Aeon AI agent skill packs.
        <br />
        Coming soon — the registry data is live, the website is being built.
      </p>

      <div
        className="holo-card"
        style={{
          marginTop: 'var(--space-6)',
          maxWidth: '400px',
          textAlign: 'left',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          className="holo-text"
          style={{ fontSize: '18px', marginBottom: 'var(--space-2)' }}
        >
          demo-pack ✦
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--purple-medium)',
            marginBottom: 'var(--space-2)',
          }}
        >
          1 skill · ✦ 0 · by @sparkleware
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--dark-violet)',
            color: 'var(--purple-light)',
            padding: 'var(--space-2) var(--space-3)',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          $ ./install-skill-pack sparkleware/demo-pack
        </div>
      </div>

      <footer
        style={{
          marginTop: 'var(--space-7)',
          fontSize: '12px',
          color: 'var(--purple-medium)',
          fontStyle: 'italic',
        }}
      >
        ~ est. 2026 — built around{' '}
        <a href="https://github.com/aaronjmars/aeon">Aeon</a> ~
      </footer>
    </main>
  );
}
