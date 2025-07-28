import { Plus, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserGroups } from "../api/groups";
import { CreateGroupModal } from "../components/groups/CreateGroupModal";
import { GroupCard } from "../components/groups/GroupCard";
import { JoinGroupModal } from "../components/groups/JoinGroupModal";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { GroupMembership, GroupWithMembers } from "../types";

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<
    (GroupWithMembers & { currentUserMembership: GroupMembership })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (err) {
      console.error("그룹 목록 로딩 실패:", err);
      setError("그룹 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadGroups}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">그룹 관리</h1>
          <p className="text-muted-foreground mt-1">
            팀원들과 함께 목표를 달성하고 진행 상황을 공유하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowJoinModal(true)}
            size="lg"
          >
            그룹 참여
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            그룹 생성
          </Button>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onGroupClick={handleGroupClick}
              onGroupUpdate={loadGroups}
            />
          ))}
        </div>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <CardTitle>참여 중인 그룹이 없습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              그룹을 만들거나 초대 코드로 그룹에 참여해보세요.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />새 그룹 만들기
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowJoinModal(true)}
                className="w-full"
              >
                초대 코드로 참여
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={loadGroups}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onGroupJoined={loadGroups}
      />
    </div>
  );
};
