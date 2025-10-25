const AuthBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7e6fff] via-[#7e6fff] to-[#7e6fff]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              135deg,
              transparent,
              transparent 80px,
              rgba(255, 255, 255, 0.05) 80px,
              rgba(255, 255, 255, 0.05) 160px
            )
          `
        }} />
      </div>
    </div>
  );
};

export default AuthBackground;
