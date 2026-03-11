export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
      {/* Large diffused orb - top left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, #a0a0a0 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Orb - bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle at center, #888888 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      {/* Orb - right edge */}
      <div
        className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle at center, #b0b0b0 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      {/* Subtle noise grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
