import React, { useState } from "react";
import { createGroup } from "../../api/groups";
import type { CreateGroupForm } from "../../types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [formData, setFormData] = useState<CreateGroupForm>({
    name: "",
    description: "",
    is_public: false,
    max_members: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("그룹 이름을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createGroup(formData);
      onGroupCreated();
      onClose();
      // 폼 초기화
      setFormData({
        name: "",
        description: "",
        is_public: false,
        max_members: 50,
      });
    } catch (err) {
      console.error("그룹 생성 실패:", err);
      setError(err instanceof Error ? err.message : "그룹 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 그룹 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">그룹 이름 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="그룹 이름을 입력하세요"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">그룹 설명</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="그룹에 대한 간단한 설명을 입력하세요"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_members">최대 멤버 수</Label>
            <Input
              id="max_members"
              type="number"
              value={formData.max_members}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_members: parseInt(e.target.value) || 50,
                })
              }
              min={2}
              max={1000}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_public"
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              disabled={loading}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="is_public" className="text-sm">
              공개 그룹으로 만들기
            </Label>
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
              disabled={loading || !formData.name.trim()}
              className="flex-1"
            >
              {loading ? "생성 중..." : "그룹 만들기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
