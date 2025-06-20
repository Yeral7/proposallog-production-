import React from "react";
import Banner from "../../components/Banner";
import Header from "../../components/Header";
import ProposalTable from "../../components/dashboard/ProposalTable";
const { getDb } = require("../../lib/db.js");
import type { Project } from "../../components/dashboard/ProposalTable";

async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  const projects = await db.all(`
    SELECT
      p.id,
      p.project_name,
      b.name as builder_name,
      e.name as estimator_name,
      s.label as status_label,
      l.name as location_name,
      p.due_date,
      p.contract_value
    FROM projects p
    LEFT JOIN builders b ON p.builder_id = b.id
    LEFT JOIN estimators e ON p.estimator_id = e.id
    LEFT JOIN statuses s ON p.status_id = s.id
    LEFT JOIN locations l ON p.location_id = l.id
  `);
  return projects;
}


export default async function ProposalLogPage() {
  const projects = await getProjects();

  return (
    <main>
      <Header />
      <Banner title="Proposal Log" />
      <ProposalTable projects={projects} />
    </main>
  );
}
