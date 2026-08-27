const isProduction = process.env.NODE_ENV === "production";

export * from isProduction
  ? "./local"
  : "./cloudinary";