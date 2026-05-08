import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const uploadRoot = process.env.FILE_STORAGE_ROOT
  ? path.resolve(process.env.FILE_STORAGE_ROOT)
  : path.join(process.cwd(), "storage", "uploads");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.signature.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.folderAccess.deleteMany();
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Demo1234!", 10);

  // Create users
  const admin = await prisma.user.create({
    data: { name: "Alice Admin", email: "admin@demo.com", password, role: "ADMIN" },
  });
  const advanced = await prisma.user.create({
    data: { name: "Bob Advanced", email: "advanced@demo.com", password, role: "ADVANCED_USER", createdById: admin.id },
  });
  const normal = await prisma.user.create({
    data: { name: "Carol User", email: "user@demo.com", password, role: "NORMAL_USER", createdById: advanced.id },
  });

  // Create folders
  const legalDocs = await prisma.folder.create({
    data: { name: "Legal Documents", ownerId: admin.id },
  });
  const contracts = await prisma.folder.create({
    data: { name: "Contracts 2024", parentId: legalDocs.id, ownerId: admin.id },
  });
  const nda = await prisma.folder.create({
    data: { name: "NDA Files", parentId: legalDocs.id, ownerId: admin.id },
  });
  const hr = await prisma.folder.create({
    data: { name: "HR Policies", ownerId: admin.id },
  });
  const finance = await prisma.folder.create({
    data: { name: "Finance Reports", ownerId: admin.id },
  });
  const q1 = await prisma.folder.create({
    data: { name: "Q1 2024", parentId: finance.id, ownerId: admin.id },
  });

  // Folder access
  await prisma.folderAccess.createMany({
    data: [
      { folderId: legalDocs.id, userId: normal.id, canView: true, canEdit: false },
      { folderId: contracts.id, userId: normal.id, canView: true, canEdit: false },
      { folderId: nda.id, userId: normal.id, canView: true, canEdit: false },
      { folderId: legalDocs.id, userId: advanced.id, canView: true, canEdit: true },
      { folderId: contracts.id, userId: advanced.id, canView: true, canEdit: true },
      { folderId: nda.id, userId: advanced.id, canView: true, canEdit: true },
      { folderId: hr.id, userId: advanced.id, canView: true, canEdit: true },
      { folderId: finance.id, userId: advanced.id, canView: true, canEdit: true },
      { folderId: q1.id, userId: advanced.id, canView: true, canEdit: true },
    ],
  });

  // Create sample PDF files (write placeholder PDFs to disk)
  const samplesDir = path.join(uploadRoot, "samples");
  if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });

  // Minimal valid PDF content
  const minimalPdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

  const sampleFiles = [
    { filename: "service-agreement.pdf", name: "Service Agreement.pdf", folderId: contracts.id },
    { filename: "employee-nda.pdf", name: "Employee NDA.pdf", folderId: nda.id },
    { filename: "q1-financial-summary.pdf", name: "Q1 Financial Summary.pdf", folderId: q1.id },
    { filename: "company-policy.pdf", name: "Company Policy.pdf", folderId: hr.id },
  ];

  for (const f of sampleFiles) {
    const filePath = path.join(samplesDir, f.filename);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, minimalPdf);
  }

  const fileRecords = [];
  for (const f of sampleFiles) {
    const record = await prisma.file.create({
      data: {
        name: f.name,
        originalName: f.name,
        mimeType: "application/pdf",
        size: 512,
        path: `storage/uploads/samples/${f.filename}`,
        folderId: f.folderId,
        uploadedById: admin.id,
      },
    });
    fileRecords.push(record);
  }

  // Create notifications
  const notifData = [
    { userId: admin.id, title: "Welcome to DocuPOC", body: "Your admin account is ready. Start by creating folders and inviting users.", type: "success", isRead: true },
    { userId: admin.id, title: "New user registered", body: "Carol User (user@demo.com) has joined the platform.", type: "info", isRead: false },
    { userId: advanced.id, title: "Welcome to DocuPOC", body: "Your account is active. You can view and manage shared documents.", type: "success", isRead: true },
    { userId: advanced.id, title: "Document uploaded", body: "A new document 'Service Agreement.pdf' was added to Contracts 2024.", type: "info", isRead: false },
    { userId: advanced.id, title: "Reminder: Q1 Review", body: "Please review the Q1 Financial Summary before end of week.", type: "reminder", isRead: false },
    { userId: normal.id, title: "Welcome to DocuPOC", body: "You have been granted access to Legal Documents. Please review and sign the NDA.", type: "success", isRead: true },
    { userId: normal.id, title: "Action Required: Sign NDA", body: "Please sign the Employee NDA document in the NDA Files folder.", type: "warning", isRead: false },
    { userId: normal.id, title: "Reminder from Bob Advanced", body: "Reminder: Sign NDA — document awaiting your signature.", type: "reminder", isRead: false },
    { userId: normal.id, title: "Document access granted", body: "You now have access to the Contracts 2024 folder.", type: "info", isRead: true },
    { userId: admin.id, title: "System initialized", body: "All demo data has been loaded successfully. The platform is ready for demonstration.", type: "info", isRead: true },
  ];
  await prisma.notification.createMany({ data: notifData });

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        senderId: admin.id,
        recipientId: advanced.id,
        subject: "Please review the Q1 report",
        body: "Hi Bob,\n\nCould you take a look at the Q1 Financial Summary before our investor meeting? It needs to be reviewed by Thursday.\n\nThanks,\nAlice",
        channel: "in_app",
        isRead: false,
      },
      {
        senderId: admin.id,
        recipientId: normal.id,
        subject: "Please sign the NDA document",
        body: "Hi Carol,\n\nWe need your signature on the Employee NDA as part of your onboarding. Please open the document in the NDA Files folder and sign it at your earliest convenience.\n\nBest,\nAlice",
        channel: "simulated_email",
        isRead: false,
      },
      {
        senderId: advanced.id,
        recipientId: normal.id,
        subject: "Reminder: Sign NDA",
        body: "Hi Carol, just a quick reminder to sign the NDA document. It's been pending for a few days. Please take care of this today.",
        channel: "simulated_sms",
        isRead: false,
      },
      {
        senderId: admin.id,
        recipientId: "all",
        subject: "Platform Update",
        body: "We have updated the document management platform with new features. Please review the new folder structure and let us know if you have any questions.",
        channel: "in_app",
        isRead: false,
      },
      {
        senderId: advanced.id,
        recipientId: admin.id,
        subject: "Re: Q1 Report Review",
        body: "Hi Alice,\n\nI have reviewed the Q1 Financial Summary. Everything looks good. A few minor formatting issues but nothing critical. Ready for the investor presentation.\n\nBob",
        channel: "in_app",
        isRead: true,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("   Admin:    admin@demo.com    / Demo1234!");
  console.log("   Advanced: advanced@demo.com / Demo1234!");
  console.log("   Normal:   user@demo.com     / Demo1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
