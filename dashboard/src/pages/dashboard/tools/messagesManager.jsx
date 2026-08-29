import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  Mail,
  Send,
  CheckCheck,
  Clock,
  Trash2,
  User,
  Phone,
  Search,
  RefreshCw,
  CornerDownRight,
  MessageSquare,
  Sparkles,
  Inbox,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

// Calculates relative time strings
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Formats full local date and time string
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Main Messages Manager Component
const MessagesManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'unread' | 'read' | 'replied'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch messages from backend
  const {
    data: responseData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['contact-messages', statusTab, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusTab !== 'all') params.append('status', statusTab);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('limit', '50');

      const res = await apiClient.get(`/api/v1/contact/messages?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 60000,
  });

  const messages = responseData?.data || [];
  const stats = responseData?.stats || { total: 0, unread: 0, read: 0, replied: 0 };

  // Fetch selected message details & mark read
  const { data: selectedDetailResponse, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['contact-message-detail', selectedMessageId],
    queryFn: async () => {
      if (!selectedMessageId) return null;
      const res = await apiClient.get(`/api/v1/contact/messages/${selectedMessageId}`);
      // Refresh notifications and message list since message was auto-marked as read
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      return res.data;
    },
    enabled: Boolean(selectedMessageId),
  });

  const activeMessage = selectedDetailResponse?.data || messages.find((m) => m.id === selectedMessageId || m.did === selectedMessageId) || null;

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, text }) => {
      const res = await apiClient.post(`/api/v1/contact/messages/${id}/reply`, {
        message: text,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Reply email sent successfully to ${activeMessage?.email || 'customer'}!`);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['contact-message-detail', selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.message || 'Failed to send reply email. Check SMTP settings.';
      toast.error(errMsg);
    },
  });

  // Toggle status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await apiClient.patch(`/api/v1/contact/messages/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Marked as ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ['contact-message-detail', selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: () => {
      toast.error('Failed to update message status.');
    },
  });

  // Handles sending reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessage) return;
    replyMutation.mutate({
      id: activeMessage.id || activeMessage.did,
      text: replyText.trim(),
    });
  };

  // Handles soft delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/contact/messages/${deleteTargetId}`);
      toast.success('Message deleted successfully.');
      if (selectedMessageId === deleteTargetId) {
        setSelectedMessageId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    } catch {
      toast.error('Failed to delete message.');
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  // Copies text to clipboard
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Messages
              {stats.unread > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                  {stats.unread} unread
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              Directly view website contact form submissions and reply to customers via email.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-8.5 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Inbox Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[620px] rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Left Pane: Message List */}
        <div
          className={`lg:col-span-5 xl:col-span-4 border-r border-border flex flex-col ${
            selectedMessageId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Filter Tabs & Search */}
          <div className="p-3 border-b border-border bg-muted/20 space-y-2.5">
            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg text-xs">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'unread', label: 'Unread', count: stats.unread },
                { key: 'replied', label: 'Replied', count: stats.replied },
                { key: 'read', label: 'Read', count: stats.read },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusTab === tab.key
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        statusTab === tab.key
                          ? 'bg-primary/15 text-primary font-bold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Messages Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[620px]">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="p-3 space-y-2 rounded-lg bg-muted/20">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-2">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No messages found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? 'Try searching with different keywords.'
                    : 'When visitors submit the contact form, their inquiries will appear here.'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessageId === (msg.id || msg.did);
                const isUnread = msg.status === 'unread';
                const isReplied = msg.status === 'replied';

                return (
                  <div
                    key={msg.id || msg.did}
                    onClick={() => setSelectedMessageId(msg.id || msg.did)}
                    className={`p-3.5 cursor-pointer transition-colors relative flex flex-col gap-1.5 text-left ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : isUnread
                        ? 'bg-primary/[0.03] hover:bg-muted/40 font-medium'
                        : 'hover:bg-muted/30 opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            isUnread
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {msg.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/90'
                          }`}
                        >
                          {msg.name}
                        </span>
                      </div>

                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeAgo(msg.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                        {msg.email}
                      </span>

                      <div>
                        {isReplied ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Replied ({msg.replies?.length || 1})
                          </Badge>
                        ) : isUnread ? (
                          <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground">
                            New
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                            Read
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Detail & Direct Reply */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-background ${
            !selectedMessageId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeMessage ? (
            <div className="flex flex-col h-full">
              {/* Message Header Bar */}
              <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-muted/10">
                <div className="flex items-start gap-3 overflow-hidden">
                  {/* Mobile Back Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMessageId(null)}
                    className="lg:hidden shrink-0 h-8 w-8 -ml-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
                    {activeMessage.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-foreground">
                        {activeMessage.name}
                      </h2>
                      {activeMessage.status === 'replied' ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          Replied
                        </Badge>
                      ) : activeMessage.status === 'unread' ? (
                        <Badge className="text-[10px] bg-primary text-primary-foreground">
                          Unread
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                          Read
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <a
                          href={`mailto:${activeMessage.email}`}
                          className="hover:text-primary hover:underline"
                        >
                          {activeMessage.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeMessage.email, 'Email')}
                          className="p-0.5 hover:text-foreground cursor-pointer"
                          title="Copy Email"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      </span>

                      {activeMessage.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <a
                            href={`tel:${activeMessage.phone}`}
                            className="hover:text-primary hover:underline"
                          >
                            {activeMessage.phone}
                          </a>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(activeMessage.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {activeMessage.status === 'read' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate({
                          id: activeMessage.id || activeMessage.did,
                          status: 'unread',
                        })
                      }
                      disabled={statusMutation.isPending}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Mark Unread
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTargetId(activeMessage.id || activeMessage.did)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Conversation Scroll Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[460px]">
                {/* Original Customer Message Bubble */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {activeMessage.name} (Customer)
                    </span>
                    <span className="text-[11px]">{formatDateTime(activeMessage.createdAt)}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-xs">
                    {activeMessage.subject && activeMessage.subject !== 'Website Contact Form' && (
                      <p className="font-semibold text-xs text-primary mb-2">
                        Subject: {activeMessage.subject}
                      </p>
                    )}
                    {activeMessage.message}
                  </div>
                </div>

                {/* Replies Thread */}
                {activeMessage.replies && activeMessage.replies.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative bg-background px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Replies ({activeMessage.replies.length})
                      </span>
                    </div>

                    {activeMessage.replies.map((reply, idx) => (
                      <div key={reply._id || reply.did || idx} className="space-y-1.5 pl-4 sm:pl-8">
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                          <span className="font-semibold text-primary flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {reply.senderName || 'Store Admin'} (via SMTP)
                          </span>
                          <span className="text-[11px]">{formatDateTime(reply.sentAt)}</span>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/[0.07] border border-primary/20 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {reply.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Reply Composer Box */}
              <div className="p-4 border-t border-border bg-muted/15">
                <form onSubmit={handleSendReply} className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <CornerDownRight className="h-3.5 w-3.5 text-primary" />
                      Reply to {activeMessage.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Will be sent directly to <strong className="text-foreground">{activeMessage.email}</strong> via SMTP
                    </span>
                  </div>

                  <Textarea
                    placeholder={`Type your response to ${activeMessage.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    disabled={replyMutation.isPending}
                    className="text-xs bg-background resize-none focus-visible:ring-primary"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Customer will receive your reply in their email inbox with quoted history.
                    </p>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="gap-1.5 cursor-pointer"
                    >
                      {replyMutation.isPending ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Sending Email...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Empty selection placeholder */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 mb-1">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Message Selected</h3>
              <p className="text-xs max-w-sm text-muted-foreground leading-relaxed">
                Choose a message from the list on the left to view customer details, read the inquiry, and send a direct email reply.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Message"
        description="Are you sure you want to delete this message? It will be removed from your active inbox."
      />
    </div>
  );
};

export default MessagesManager;
