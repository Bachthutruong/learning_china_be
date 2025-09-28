"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const util_1 = require("util");
dotenv_1.default.config();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function runSeedScript(scriptName, description) {
    try {
        console.log(`\n🚀 Starting ${description}...`);
        const { stdout, stderr } = await execAsync(`npm run ${scriptName}`);
        if (stdout) {
            console.log(stdout);
        }
        if (stderr) {
            console.error(stderr);
        }
        console.log(`✅ ${description} completed successfully!`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error running ${description}:`, error);
        return false;
    }
}
async function seedMaster() {
    console.log('🎯 Starting Master Seed Process...');
    console.log('=====================================');
    const scripts = [
        { script: 'seed:data', description: 'Basic Data Seeding' },
        { script: 'seed:advanced', description: 'Advanced Data Seeding' },
        { script: 'seed:admin', description: 'Admin User Seeding' }
    ];
    let successCount = 0;
    let totalCount = scripts.length;
    for (const { script, description } of scripts) {
        const success = await runSeedScript(script, description);
        if (success) {
            successCount++;
        }
        // Add a small delay between scripts
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n=====================================');
    console.log('📊 Master Seed Summary:');
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${totalCount - successCount}/${totalCount}`);
    if (successCount === totalCount) {
        console.log('\n🎉 All seeding completed successfully!');
        console.log('\n📋 What was seeded:');
        console.log('   • Topics (8 categories)');
        console.log('   • Levels (6 levels)');
        console.log('   • Users (20+ users)');
        console.log('   • Vocabularies (50+ words)');
        console.log('   • Tests (6+ tests)');
        console.log('   • Proficiency Tests (3 levels)');
        console.log('   • Competitions (2 competitions)');
        console.log('   • Reports (6+ reports)');
        console.log('   • Competition Results');
        console.log('   • Payment History');
        console.log('   • Admin User');
        console.log('\n🔗 Database is ready for use!');
        console.log('   Admin Login: admin@example.com / Admin@123456');
    }
    else {
        console.log('\n⚠️  Some seeding failed. Please check the errors above.');
    }
}
// Run the master seed
seedMaster().catch(console.error);
//# sourceMappingURL=seedMaster.js.map