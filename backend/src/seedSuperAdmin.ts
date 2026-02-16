import { connectDB } from "./core/db";
import { SuperAdmin } from "./modules/super-admin/superAdmin.model";
import { hashPassword } from "./utils/password";

async function run() {
    await connectDB();

    const email = "admin@example.com";
    const password = "admin123";

    await SuperAdmin.deleteMany({ email });

    const passwordHash = await hashPassword(password);

    await SuperAdmin.create({
        email,
        passwordHash,
    });

    console.log("✅ Super admin created/reset");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
}

run();
