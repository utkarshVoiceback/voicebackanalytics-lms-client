import * as XLSX from 'xlsx';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ExportOptions {
  conversationId: string;
  participantName?: string;
  batchName?: string;
}

export const exportChatToExcel = (messages: Message[], options: ExportOptions) => {
  if (!messages || messages.length === 0) {
    alert('No messages to export');
    return;
  }

  const formattedMessages = messages.map((msg) => ({
    'Timestamp': new Date(msg.createdAt).toLocaleString(),
    'Sender': msg.senderRole,
    'Message': msg.message,
    'Read': msg.isRead ? 'Yes' : 'No',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedMessages);

  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 50 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat History');

  const fileName = `Chat_${options.participantName || 'Conversation'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

interface Learner {
  id: string;
  user: {
    fullName: string;
    email: string;
    mobile: string | null;
  };
  batch: {
    batchTitle: string;
  };
  status: string;
}

export const exportLearnersToExcel = (learners: Learner[]) => {
  if (!learners || learners.length === 0) {
    alert('No learners to export');
    return;
  }

  const formattedLearners = learners.map((learner) => ({
    'Name': learner.user.fullName,
    'Email': learner.user.email,
    'Mobile': learner.user.mobile || '-',
    'Batch': learner.batch.batchTitle,
    'Status': learner.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedLearners);

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Learners');

  const fileName = `Learners_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

interface Batch {
  id: string;
  batchTitle: string;
  startDate: string;
  endDate: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  batchSize: number;
  enrolledCount?: number;
  status: string;
  dynamicStatus?: string;
}

export const exportBatchesToExcel = (batches: Batch[]) => {
  if (!batches || batches.length === 0) {
    alert('No batches to export');
    return;
  }

  const formattedBatches = batches.map((batch) => ({
    'Batch Title': batch.batchTitle,
    'Batch Period': `${new Date(batch.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(batch.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
    'Enrollment Period': `${new Date(batch.enrollmentStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(batch.enrollmentEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    'Capacity': `${batch.enrolledCount}/${batch.batchSize}`,
    'Available': batch.batchSize - (batch.enrolledCount || 0),
    'Status': batch.dynamicStatus || batch.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedBatches);

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches');

  const fileName = `Batches_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
