import React, { useState } from "react";
import { joinGroup } from "../../api/groups";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupJoined,
}) => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("초대 코드를 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await joinGroup(inviteCode.trim());
      onGroupJoined();
      onClose();
      setInviteCode("");
    } catch (err) {
      console.error("그룹 참여 실패:", err);
      setError(err instanceof Error ? err.message : "그룹 참여에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setInviteCode("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>그룹 참여하기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite_code">초대 코드 *</Label>
            <Input
              id="invite_code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="초대 코드를 입력하세요"
              disabled={loading}
              className="font-mono"
            />
            <p className="text-sm text-gray-600">
              그룹 관리자로부터 받은 초대 코드를 입력하세요
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="flex-1"
            >
              {loading ? "참여 중..." : "그룹 참여하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
