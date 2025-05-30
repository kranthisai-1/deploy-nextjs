/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Heading from '@/components/Heading';
import toast from 'react-hot-toast';
import { formatDateTime, formatPhoneNumber, formatDate } from '@/utils/utils';
import DetailsPage from '@/components/DetailsPage';
import { InviteCode } from '../type';
import Modal from '@/components/Modal';
import InviteCodeModal from '@/components/InviteCodeModal';
import dayjs from 'dayjs';
import Table, { Column } from '@/components/Table';
import { mapTableData } from '@/utils/mapTableData';
import PaginationComponent from '@/components/PaginationComponent';
import { PaginationQueryParams } from '@/types/PaginationQueryParams';
import { Spinner } from '@/components/Spinner';
import { InviteCodeUserDetailsPaginatedResponse } from './type';
import { useApiInstance } from '@/hooks/useApiInstance';
import { isFailureResponse } from '@/utils/isFailureResponse';
import { handleResponse } from '@/utils/handleResponse';
import { DetailItem } from '@/components/DetailItemComponent';

export default function InviteCodeDetails() {
  const { id } = useParams();
  const api = useApiInstance();
  const searchParams = useSearchParams();
  const pageFromURL = parseInt(searchParams.get('page') || '1');
  const router = useRouter();
  const [inviteCodeDetails, setInviteCodeDetails] = useState<InviteCode | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalAction, setModalAction] = useState<'Delete' | 'Edit' | null>(
    null,
  );
  const [invitedUsersData, setInvitedUsersData] =
    useState<InviteCodeUserDetailsPaginatedResponse>();
  const [invitedUsersLoading, setInvitedUsersLoading] = useState(false);
  const [paginationParams, setPaginationParams] =
    useState<PaginationQueryParams>({
      page: pageFromURL,
      limit: 10,
      code: id as string,
    });

  const openModal = (action: 'Delete' | 'Edit') => {
    setModalAction(action);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!id) return;
    fetchInviteCodeDetails();
  }, [id]);

  const fetchInviteCodeDetails = async () => {
    setIsLoading(true);
    try {
      const response: InviteCode = await handleResponse(
        api.authenticatedGet(`/internal/invites/${id}`),
      );
      setInviteCodeDetails(response);
    } catch (error) {
      if (isFailureResponse(error)) {
        toast.error(error.message || 'Failed to fetch invite code details');
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchInviteUsers = async () => {
      setInvitedUsersLoading(true);
      try {
        const response: InviteCodeUserDetailsPaginatedResponse =
          await handleResponse(
            api.authenticatedGet(`/internal/invites/code/users`, {
              ...paginationParams,
            }),
          );

        setInvitedUsersData(response);
      } catch (error) {
        if (isFailureResponse(error)) {
          toast.error(error.message || 'Failed to fetch invite code users');
        } else {
          toast.error('Something went wrong');
        }
      } finally {
        setInvitedUsersLoading(false);
      }
    };

    fetchInviteUsers();
  }, [paginationParams]);

  const details: DetailItem[] = inviteCodeDetails
    ? [
        {
          label: 'Code',
          value: inviteCodeDetails.code,
          copyable: true,
        },
        {
          label: 'Status',
          value: (
            <span
              className={
                inviteCodeDetails.status === 'ACTIVE' ? 'active' : 'blocked'
              }
            >
              {inviteCodeDetails.status === 'ACTIVE' ? 'Active' : 'Expired'}
            </span>
          ),
        },
        {
          label: 'Generated By',
          value: inviteCodeDetails.generated_by_user_uuid,
          copyable: true,
        },
        {
          label: 'Expires At',
          value: formatDate(inviteCodeDetails.expires_at),
        },
        {
          label: 'Usage',
          value: (
            <span>
              {inviteCodeDetails.number_of_times_used !== undefined &&
              inviteCodeDetails.maximum_use_limit !== undefined
                ? `${inviteCodeDetails.number_of_times_used} / ${inviteCodeDetails.maximum_use_limit}`
                : '-'}
            </span>
          ),
        },
      ]
    : [];

  const inviteCodeManageOptions = inviteCodeDetails
    ? [
        {
          label: 'Manage',
          isDropdown: true,
          dropdownItems: [
            {
              label: 'Delete',
              onClick: () => openModal('Delete'),
            },
            {
              label: 'Edit',
              onClick: () => openModal('Edit'),
            },
          ],
        },
      ]
    : [];

  const handleDelete = async () => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const response = await handleResponse(
        api.authenticatedDelete(`/internal/invites/${id}`),
      );
      router.replace('/invite_codes');
      setIsOpen(false);
      if (response.message) {
        toast.success('Invite Code deleted successfully');
      }
    } catch (error) {
      if (isFailureResponse(error)) {
        toast.error(error.message || 'Failed to delete Invite Code');
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column[] = [
    { label: 'User Uuid', field: 'user_uuid' },
    { label: 'Name', field: ['first_name', 'last_name'] },
    { label: 'Phone No.', field: 'phone', formatter: formatPhoneNumber },
    { label: 'Email', field: 'email' },
    { label: 'Claimed At', field: 'claimed_at', formatter: formatDateTime },
  ];

  const tableData = invitedUsersData?.data
    ? mapTableData(invitedUsersData.data, columns)
    : [];

  return (
    <>
      <div className="min-h-[100%] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
        <Heading
          headingText="Invite Code Details"
          className="px-0 pt-0"
          buttons={inviteCodeManageOptions}
          navigateTo="/invite_codes"
        />
        <DetailsPage details={details} isLoading={isLoading} />

        {inviteCodeDetails && (
          <>
            <Heading
              headingText="Invite Code Users"
              showBackButton={false}
              className="!text-2xl px-1"
            />

            <div className="space-y-3 pb-2 pt-4">
              {invitedUsersData && (
                <Table data={tableData!} columns={columns} />
              )}

              {invitedUsersData && invitedUsersData.total_page !== 0 && (
                <PaginationComponent
                  paginationParams={paginationParams}
                  setPaginationParams={setPaginationParams}
                  successResponse={invitedUsersData}
                  isLoading={invitedUsersLoading}
                />
              )}
              {invitedUsersLoading && !invitedUsersData && (
                <Spinner className="mt-10" />
              )}
            </div>
          </>
        )}

        {modalAction === 'Delete' && (
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={'Delete Invite Code'}
            onConfirm={handleDelete}
            isLoading={isUpdating}
            disableButtons={isUpdating}
            width="w-[28rem]"
            height="h-[11.5rem]"
          >
            <div className="px-3">
              {'Are you sure you wanna Delete this Invite Code'}
            </div>
          </Modal>
        )}

        {modalAction === 'Edit' && inviteCodeDetails && (
          <InviteCodeModal
            isOpen={isOpen}
            onSuccess={fetchInviteCodeDetails}
            onClose={() => setIsOpen(false)}
            initialValues={{
              code: inviteCodeDetails.code,
              maximum_use_limit: inviteCodeDetails.maximum_use_limit,
              expires_at: inviteCodeDetails.expires_at
                ? dayjs(inviteCodeDetails.expires_at).format('YYYY-MM-DD')
                : undefined,
            }}
          />
        )}
      </div>
    </>
  );
}
