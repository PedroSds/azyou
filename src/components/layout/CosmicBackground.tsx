export default function CosmicBackground() {
  return (
    <>
      {/* Stars animation layer */}
      <div className="stars-container" />

      {/* Nebula glows */}
      <div
        className="nebula w-[600px] h-[600px] -top-40 -left-40 opacity-20"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <div
        className="nebula w-[500px] h-[500px] top-1/3 -right-40 opacity-15"
        style={{ background: 'radial-gradient(circle, #0F2557 0%, transparent 70%)' }}
      />
      <div
        className="nebula w-[400px] h-[400px] bottom-0 left-1/4 opacity-10"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
      />
    </>
  );
}
