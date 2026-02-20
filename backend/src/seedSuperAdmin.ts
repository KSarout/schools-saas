import {connectDB} from "./core/db";
import {SuperAdminModel} from "./modules/super-admin/model/superAdmin.model";
import {hashPassword} from "./utils/password";

async function run() {
    await connectDB();
    const name = "Super Admin";
    const email = "admin@example.com";
    const password = "admin123";
    await SuperAdminModel.deleteMany({email});
    const passwordHash = await hashPassword(password);
    await SuperAdminModel.create({
        name,
        email,
        passwordHash,
    });

    console.log("✅ Super admin created/reset");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
}

run();
