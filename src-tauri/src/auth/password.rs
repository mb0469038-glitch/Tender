use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;

pub fn hash_password(plain: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(plain.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|error| error.to_string())
}

pub fn verify_password(hash: &str, plain: &str) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(hash).map_err(|error| error.to_string())?;
    Ok(Argon2::default().verify_password(plain.as_bytes(), &parsed_hash).is_ok())
}
