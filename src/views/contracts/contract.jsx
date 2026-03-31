
import React from 'react';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import ContractsFlow from '../../components/ContractsFlow.jsx';
import { useParams } from 'react-router-dom';
export default function ContractPage(){ const { jobId } = useParams(); return (<DashboardLayout role="customer"><ContractsFlow jobId={jobId} /></DashboardLayout>); }
