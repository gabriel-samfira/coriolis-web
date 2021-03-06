/*
 Copyright (C) 2017  Cloudbase Solutions SRL

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


import React from 'react';
import Router from 'react-routing/src/Router';
import App from './components/App';
import MigrationWizard from './components/MigrationWizard';
import WithSidebar from './components/WithSidebar';
import MigrationList from './components/MigrationList';
import MigrationView from './components/MigrationView';
import ReplicaList from './components/ReplicaList';
import ReplicaView from './components/ReplicaView';
import ReplicaDetail from './components/ReplicaDetail';
import MigrationDetail from './components/MigrationDetail';
import MigrationTasks from './components/MigrationTasks';
import ReplicaSchedule from './components/ReplicaSchedule';
import CloudConnection from './components/CloudConnection';
import CloudConnectionsView from './components/CloudConnectionsView';
import CloudConnectionDetail from './components/CloudConnectionDetail';
import CloudConnectionAuth from './components/CloudConnectionAuth';
import ConnectionsList from './components/EndpointList';
import Project from './components/Project';
import ProjectDetail from './components/ProjectDetail';
import ProjectList from './components/ProjectList';
import ReplicaExecutions from './components/ReplicaExecutions';
import UserView from './components/UserView';
import UserOverview from './components/UserOverview';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';
import Federate from './components/Federate';

const router = new Router(on => {
  on('*', async (state, next) => {
    const component = await next();
    return component && <App context={state.context}>{component}</App>;
  });

  on('/', async () => <LoginPage />)

  on('/login', async () => <LoginPage />)

  on('/federate/:token', async (params) => <Federate token={params.params.token} />)

  on('/migrations', async () => <WithSidebar route="/migrations"><MigrationList /></WithSidebar>)

  on('/migrations/new', async () => <MigrationWizard wizard_type="migration" />)

  on('/migration/:migrationId/', async (params) =>
    <MigrationView migrationId={params.params.migrationId} type="detail"><MigrationDetail /></MigrationView>
  )

  on('/migration/tasks/:migrationId/', async (params) =>
    <MigrationView migrationId={params.params.migrationId} type="tasks"><MigrationTasks /></MigrationView>
  )

  on('/migration/schedule/:migrationId/', async (params) =>
    <MigrationView migrationId={params.params.migrationId} type="schedule"><ReplicaSchedule /></MigrationView>
  )

  on('/replicas', async () => <WithSidebar route="/replicas"><ReplicaList /></WithSidebar>)

  on('/replicas/new', async () => <MigrationWizard wizard_type="replica" />)

  on('/replica/:replicaId/', async (params) =>
    <ReplicaView replicaId={params.params.replicaId} type="detail"><ReplicaDetail /></ReplicaView>
  )

  on('/replica/executions/:replicaId/', async (params) =>
    <ReplicaView replicaId={params.params.replicaId} type="tasks"><ReplicaExecutions /></ReplicaView>
  )

  on('/replica/schedule/:replicaId/', async (params) =>
    <ReplicaView replicaId={params.params.replicaId} type="schedule"><ReplicaSchedule /></ReplicaView>
  )

  on('/cloud-endpoints', async () =>
    <WithSidebar route="/cloud-endpoints"><ConnectionsList /></WithSidebar>
  )

  on('/cloud-endpoints/:connectionId/', async (params) =>
    <CloudConnection connectionId={params.params.connectionId}>
      <CloudConnectionsView type="detail">
        <CloudConnectionDetail />
      </CloudConnectionsView>
    </CloudConnection>
  )

  on('/cloud-endpoints/auth/:connectionId/', async (params) =>
    <CloudConnection connectionId={params.params.connectionId}>
      <CloudConnectionsView type="auth">
        <CloudConnectionAuth />
      </CloudConnectionsView>
    </CloudConnection>
  )

  on('/projects', async () =>
    <WithSidebar route="/projects"><ProjectList /></WithSidebar>
  )

  on('/project/details/:projectId/', async (params) =>
    <Project projectId={params.params.projectId}>
      <ProjectDetail />
    </Project>
  )

  on('/user/profile/', async () => <UserView type="profile"><UserOverview /></UserView>)

  on('/user/billing/', async () =>
    <UserView type="billing"><div className="no-result">Nothing here yet</div></UserView>
  )

  on('/contact', async () => <ContactPage />);

  on('/login', async () => <LoginPage />);

  on('/register', async () => <RegisterPage />);

  on('error', (state, error) => state.statusCode === 404 ?
    <App context={state.context} error={error}><NotFoundPage /></App> :
    <App context={state.context} error={error}><ErrorPage /></App>
  );
});

export default router;
