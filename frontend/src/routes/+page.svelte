<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';

	const API_BASE_URL = env.PUBLIC_API_URL || 'http://127.0.0.1:3008/api';
	const API_URL = `${API_BASE_URL}/students`;
	const AUTH_URL = `${API_BASE_URL}/auth`;

	type StudentStatus = 'active' | 'inactive';
	type StatusFilter = 'all' | StudentStatus;
	type ActiveView = 'overview' | 'students' | 'workouts' | 'exercises' | 'progress';
	type AuthMode = 'login' | 'register';

	const sidebarItems: Array<{
		id: ActiveView;
		label: string;
		eyebrow: string;
		title: string;
		description: string;
	}> = [
		{
			id: 'overview',
			label: 'Visao geral',
			eyebrow: 'Dashboard',
			title: 'Visao geral',
			description: 'Indicadores gerais da academia serao exibidos aqui.'
		},
		{
			id: 'students',
			label: 'Alunos',
			eyebrow: 'AC1 - Gestao de alunos',
			title: 'Alunos',
			description: 'Gerencie cadastros, contatos e situacao dos alunos da academia.'
		},
		{
			id: 'workouts',
			label: 'Treinos',
			eyebrow: 'AC2 - Gestao de treinos',
			title: 'Treinos',
			description: 'Criacao e atribuicao de treinos personalizados entrara nesta etapa.'
		},
		{
			id: 'exercises',
			label: 'Exercicios',
			eyebrow: 'AC2 - Biblioteca de exercicios',
			title: 'Exercicios',
			description: 'A biblioteca de exercicios ficara disponivel junto com a gestao de treinos.'
		},
		{
			id: 'progress',
			label: 'Evolucao',
			eyebrow: 'Entrega final - Dashboard',
			title: 'Evolucao',
			description:
				'Graficos de desempenho e historico de execucao serao implementados na entrega final.'
		}
	];

	interface Student {
		id: string;
		name: string;
		email: string;
		phone: string;
		birthDate?: string;
		enrollmentDate: string;
		status: StudentStatus;
		createdAt: string;
		updatedAt: string;
	}

	interface StudentForm {
		name: string;
		email: string;
		phone: string;
		birthDate: string;
		enrollmentDate: string;
		status: StudentStatus;
	}

	interface LoginForm {
		email: string;
		password: string;
	}

	interface RegisterForm {
		name: string;
		email: string;
		phone: string;
		password: string;
		confirmPassword: string;
	}

	interface AuthenticatedUser {
		id: string;
		name: string;
		email: string;
		phone?: string;
		role: 'teacher';
		status: 'active' | 'inactive';
	}

	const emptyForm = (): StudentForm => ({
		name: '',
		email: '',
		phone: '',
		birthDate: '',
		enrollmentDate: new Date().toISOString().slice(0, 10),
		status: 'active'
	});

	let students = $state<Student[]>([]);
	let selectedStudentId = $state<string | null>(null);
	let editingStudentId = $state<string | null>(null);
	let form = $state<StudentForm>(emptyForm());
	let searchTerm = $state('');
	let statusFilter = $state<StatusFilter>('all');
	let activeView = $state<ActiveView>('students');
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isAuthSubmitting = $state(false);
	let isStudentModalOpen = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let authMode = $state<AuthMode>('login');
	let isAuthenticated = $state(false);
	let currentUser = $state<AuthenticatedUser | null>(null);
	let authErrorMessage = $state('');
	let showLoginPassword = $state(false);
	let showRegisterPassword = $state(false);
	let showRegisterConfirmPassword = $state(false);
	let loginForm = $state<LoginForm>({
		email: '',
		password: ''
	});
	let registerForm = $state<RegisterForm>({
		name: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: ''
	});

	let activeStudentsCount = $derived(
		students.filter((student) => student.status === 'active').length
	);
	let inactiveStudentsCount = $derived(students.length - activeStudentsCount);
	let activeStudentsPercent = $derived(calculatePercent(activeStudentsCount, students.length));
	let inactiveStudentsPercent = $derived(calculatePercent(inactiveStudentsCount, students.length));
	let isEditing = $derived(Boolean(editingStudentId));
	let filteredStudents = $derived(
		students.filter((student) => {
			const normalizedSearch = searchTerm.trim().toLowerCase();
			const matchesSearch =
				!normalizedSearch ||
				student.name.toLowerCase().includes(normalizedSearch) ||
				student.email.toLowerCase().includes(normalizedSearch) ||
				student.phone.toLowerCase().includes(normalizedSearch);
			const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

			return matchesSearch && matchesStatus;
		})
	);
	let selectedStudent = $derived(
		students.find((student) => student.id === selectedStudentId) ?? filteredStudents[0] ?? null
	);
	let activeViewInfo = $derived(
		sidebarItems.find((item) => item.id === activeView) ?? sidebarItems[1]
	);
	let authErrorTimeout: ReturnType<typeof setTimeout> | undefined;
	let errorTimeout: ReturnType<typeof setTimeout> | undefined;
	let successTimeout: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		void loadStudents();
	});

	function switchAuthMode(mode: AuthMode) {
		authMode = mode;
		clearAuthError();
	}

	async function submitLogin() {
		clearAuthError();

		if (!loginForm.email.trim() || !loginForm.password.trim()) {
			showAuthError('Informe email e senha para entrar.');
			return;
		}

		isAuthSubmitting = true;

		try {
			const response = await fetch(`${AUTH_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: loginForm.email.trim(),
					password: loginForm.password
				})
			});

			if (!response.ok) {
				throw new Error(await getApiErrorMessage(response, 'Email ou senha invalidos.'));
			}

			currentUser = (await response.json()) as AuthenticatedUser;
			isAuthenticated = true;
			await loadStudents();
		} catch (error) {
			showAuthError(error instanceof Error ? error.message : 'Erro inesperado ao entrar.');
		} finally {
			isAuthSubmitting = false;
		}
	}

	async function submitRegister() {
		clearAuthError();

		if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
			showAuthError('Preencha nome, email e senha para criar a conta.');
			return;
		}

		if (registerForm.password !== registerForm.confirmPassword) {
			showAuthError('As senhas informadas nao conferem.');
			return;
		}

		isAuthSubmitting = true;

		try {
			const response = await fetch(`${AUTH_URL}/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: registerForm.name.trim(),
					email: registerForm.email.trim(),
					phone: registerForm.phone.trim() || undefined,
					password: registerForm.password,
					confirmPassword: registerForm.confirmPassword
				})
			});

			if (!response.ok) {
				throw new Error(await getApiErrorMessage(response, 'Nao foi possivel criar a conta.'));
			}

			currentUser = (await response.json()) as AuthenticatedUser;
			loginForm = {
				email: registerForm.email,
				password: registerForm.password
			};
			isAuthenticated = true;
			await loadStudents();
		} catch (error) {
			showAuthError(error instanceof Error ? error.message : 'Erro inesperado ao criar conta.');
		} finally {
			isAuthSubmitting = false;
		}
	}

	function logout() {
		isAuthenticated = false;
		currentUser = null;
		authMode = 'login';
		loginForm = {
			email: '',
			password: ''
		};
	}

	async function getApiErrorMessage(response: Response, fallbackMessage: string) {
		const error = (await response.json().catch(() => null)) as {
			message?: string | string[];
		} | null;
		const message = Array.isArray(error?.message) ? error.message.join(' ') : error?.message;

		return translateErrorMessage(message ?? fallbackMessage);
	}

	function translateErrorMessage(message: string) {
		const normalizedMessage = message.toLowerCase();

		if (normalizedMessage.includes('failed to fetch')) {
			return 'Nao foi possivel conectar com a API. Verifique se o backend esta rodando.';
		}

		if (
			normalizedMessage.includes('invalid email or password') ||
			normalizedMessage.includes('email ou senha invalidos')
		) {
			return 'Email ou senha invalidos.';
		}

		if (
			normalizedMessage.includes('already exists') ||
			normalizedMessage.includes('duplicate key')
		) {
			return 'Ja existe um cadastro com este email.';
		}

		if (
			normalizedMessage.includes('password must be longer than or equal to 6 characters') ||
			normalizedMessage.includes('password must be longer')
		) {
			return 'A senha deve ter pelo menos 6 caracteres.';
		}

		if (normalizedMessage.includes('email must be an email')) {
			return 'Informe um email valido.';
		}

		if (normalizedMessage.includes('validation failed')) {
			return 'Confira os dados informados e tente novamente.';
		}

		return message;
	}

	function showAuthError(message: string) {
		authErrorMessage = translateErrorMessage(message);
		clearTimeout(authErrorTimeout);
		authErrorTimeout = setTimeout(() => {
			authErrorMessage = '';
		}, 3000);
	}

	function clearAuthError() {
		authErrorMessage = '';
		clearTimeout(authErrorTimeout);
	}

	function showError(message: string) {
		errorMessage = translateErrorMessage(message);
		clearTimeout(errorTimeout);
		errorTimeout = setTimeout(() => {
			errorMessage = '';
		}, 3000);
	}

	function clearError() {
		errorMessage = '';
		clearTimeout(errorTimeout);
	}

	function showSuccess(message: string) {
		successMessage = message;
		clearTimeout(successTimeout);
		successTimeout = setTimeout(() => {
			successMessage = '';
		}, 3000);
	}

	function clearSuccess() {
		successMessage = '';
		clearTimeout(successTimeout);
	}

	async function loadStudents() {
		isLoading = true;
		clearError();

		try {
			const response = await fetch(API_URL);
			if (!response.ok) {
				throw new Error('Nao foi possivel carregar os alunos.');
			}

			students = (await response.json()) as Student[];
			selectedStudentId = selectedStudentId ?? students[0]?.id ?? null;
		} catch (error) {
			students = [];
			selectedStudentId = null;
			showError(error instanceof Error ? error.message : 'Erro inesperado ao carregar alunos.');
		} finally {
			isLoading = false;
		}
	}

	function openCreateModal() {
		form = emptyForm();
		editingStudentId = null;
		clearError();
		clearSuccess();
		isStudentModalOpen = true;
	}

	function closeStudentModal() {
		isStudentModalOpen = false;
		form = emptyForm();
		editingStudentId = null;
	}

	function startEditing(student: Student) {
		editingStudentId = student.id;
		selectedStudentId = student.id;
		clearSuccess();
		clearError();
		form = {
			name: student.name,
			email: student.email,
			phone: student.phone,
			birthDate: student.birthDate ?? '',
			enrollmentDate: student.enrollmentDate,
			status: student.status
		};
		isStudentModalOpen = true;
	}

	async function saveStudent() {
		isSubmitting = true;
		clearError();
		clearSuccess();

		const payload = {
			name: form.name.trim(),
			email: form.email.trim(),
			phone: form.phone.trim(),
			birthDate: form.birthDate || undefined,
			enrollmentDate: form.enrollmentDate || undefined,
			status: form.status
		};

		try {
			const response = await fetch(editingStudentId ? `${API_URL}/${editingStudentId}` : API_URL, {
				method: editingStudentId ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(await getApiErrorMessage(response, 'Nao foi possivel salvar o aluno.'));
			}

			const savedStudent = (await response.json()) as Student;

			if (editingStudentId) {
				students = students.map((student) =>
					student.id === savedStudent.id ? savedStudent : student
				);
				showSuccess('Aluno atualizado com sucesso.');
			} else {
				students = [...students, savedStudent];
				showSuccess('Aluno cadastrado com sucesso.');
			}

			selectedStudentId = savedStudent.id;
			closeStudentModal();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Erro inesperado ao salvar aluno.');
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteStudent(student: Student) {
		const shouldDelete = confirm(`Excluir o aluno ${student.name}?`);
		if (!shouldDelete) return;

		clearError();
		clearSuccess();

		try {
			const response = await fetch(`${API_URL}/${student.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Nao foi possivel excluir o aluno.');
			}

			students = students.filter((item) => item.id !== student.id);
			selectedStudentId = students[0]?.id ?? null;
			showSuccess('Aluno excluido com sucesso.');
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Erro inesperado ao excluir aluno.');
		}
	}

	function calculatePercent(value: number, total: number) {
		if (total === 0) return '0,0%';

		return new Intl.NumberFormat('pt-BR', {
			style: 'percent',
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		}).format(value / total);
	}

	function formatDate(date?: string) {
		if (!date) return '-';

		return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('');
	}
</script>

<svelte:head>
	<title>Gym Management | Alunos</title>
	<meta name="description" content="Gestao de alunos, treinos e evolucao para academias." />
</svelte:head>

{#if !isAuthenticated}
	<main class="auth-shell">
		<section class="auth-hero">
			<span class="auth-brand-mark" aria-hidden="true"></span>
			<p class="eyebrow">Gym Management</p>
			<h1>Organize alunos, treinos e evolucao em um unico lugar.</h1>
			<p>
				Acesse como professor para gerenciar cadastros, montar treinos e acompanhar o desempenho dos
				alunos.
			</p>
		</section>

		<section class="auth-card" aria-label="Acesso do professor">
			<div class="auth-tabs" role="tablist" aria-label="Escolha entre entrar e criar conta">
				<button
					class:active={authMode === 'login'}
					type="button"
					aria-selected={authMode === 'login'}
					role="tab"
					onclick={() => switchAuthMode('login')}
				>
					Entrar
				</button>
				<button
					class:active={authMode === 'register'}
					type="button"
					aria-selected={authMode === 'register'}
					role="tab"
					onclick={() => switchAuthMode('register')}
				>
					Criar conta
				</button>
			</div>

			{#if authErrorMessage}
				<p class="feedback error">{authErrorMessage}</p>
			{/if}

			{#if authMode === 'login'}
				<form class="auth-form" onsubmit={(event) => event.preventDefault()}>
					<div>
						<h2>Acesso do professor</h2>
						<p>Entre para continuar a gestao da academia.</p>
					</div>

					<label>
						<span>Email</span>
						<input bind:value={loginForm.email} autocomplete="email" required type="email" />
					</label>

					<label>
						<span>Senha</span>
						<span class="password-field">
							<input
								bind:value={loginForm.password}
								autocomplete="current-password"
								required
								type={showLoginPassword ? 'text' : 'password'}
							/>
							<button
								class="password-toggle"
								type="button"
								aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
								onclick={() => (showLoginPassword = !showLoginPassword)}
							>
								<span class:visible={showLoginPassword}></span>
							</button>
						</span>
					</label>

					<button
						class="primary-button full"
						disabled={isAuthSubmitting}
						type="button"
						onclick={submitLogin}
					>
						{isAuthSubmitting ? 'Entrando...' : 'Entrar'}
					</button>
				</form>
			{:else}
				<form class="auth-form" onsubmit={(event) => event.preventDefault()}>
					<div>
						<h2>Cadastro de professor</h2>
						<p>Crie sua conta para comecar a configurar a academia.</p>
					</div>

					<label>
						<span>Nome</span>
						<input bind:value={registerForm.name} autocomplete="name" required />
					</label>

					<label>
						<span>Email</span>
						<input bind:value={registerForm.email} autocomplete="email" required type="email" />
					</label>

					<label>
						<span>Telefone</span>
						<input bind:value={registerForm.phone} autocomplete="tel" />
					</label>

					<div class="field-grid">
						<label>
							<span>Senha</span>
							<span class="password-field">
								<input
									bind:value={registerForm.password}
									autocomplete="new-password"
									required
									type={showRegisterPassword ? 'text' : 'password'}
								/>
								<button
									class="password-toggle"
									type="button"
									aria-label={showRegisterPassword ? 'Ocultar senha' : 'Mostrar senha'}
									onclick={() => (showRegisterPassword = !showRegisterPassword)}
								>
									<span class:visible={showRegisterPassword}></span>
								</button>
							</span>
						</label>

						<label>
							<span>Confirmar senha</span>
							<span class="password-field">
								<input
									bind:value={registerForm.confirmPassword}
									autocomplete="new-password"
									required
									type={showRegisterConfirmPassword ? 'text' : 'password'}
								/>
								<button
									class="password-toggle"
									type="button"
									aria-label={showRegisterConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
									onclick={() => (showRegisterConfirmPassword = !showRegisterConfirmPassword)}
								>
									<span class:visible={showRegisterConfirmPassword}></span>
								</button>
							</span>
						</label>
					</div>

					<button
						class="primary-button full"
						disabled={isAuthSubmitting}
						type="button"
						onclick={submitRegister}
					>
						{isAuthSubmitting ? 'Criando conta...' : 'Criar conta'}
					</button>
				</form>
			{/if}
		</section>
	</main>
{:else}
	<div class="app-shell">
		<aside class="sidebar" aria-label="Navegacao principal">
			<div class="brand">
				<span class="brand-mark" aria-hidden="true"><span></span></span>
				<div>
					<strong>Gym</strong>
					<span>{currentUser?.name ?? 'Management'}</span>
				</div>
			</div>

			<nav class="nav">
				{#each sidebarItems as item (item.id)}
					<button
						class:active={activeView === item.id}
						class="nav-item"
						type="button"
						onclick={() => (activeView = item.id)}
					>
						<span class="nav-dot" aria-hidden="true"></span>
						{item.label}
					</button>
				{/each}
			</nav>

			<div class="teacher-box">
				<strong>{currentUser?.name}</strong>
				<span>{currentUser?.email}</span>
			</div>

			<button class="logout-button" type="button" onclick={logout}>Sair</button>
		</aside>

		<main class="content">
			<header class="page-header">
				<div>
					<p class="eyebrow">{activeViewInfo.eyebrow}</p>
					<h1>{activeViewInfo.title}</h1>
					<p>{activeViewInfo.description}</p>
				</div>
				{#if activeView === 'students'}
					<button class="primary-button" type="button" onclick={openCreateModal}
						>+ Novo aluno</button
					>
				{/if}
			</header>

			{#if activeView === 'students'}
				<section class="metrics" aria-label="Indicadores de alunos">
					<article class="metric-card">
						<span class="metric-label">Total alunos</span>
						<strong>{students.length}</strong>
						<p>Alunos cadastrados</p>
					</article>
					<article class="metric-card">
						<span class="metric-label">Ativos</span>
						<strong>{activeStudentsCount}</strong>
						<p>{activeStudentsPercent} do total</p>
					</article>
					<article class="metric-card">
						<span class="metric-label">Inativos</span>
						<strong>{inactiveStudentsCount}</strong>
						<p>{inactiveStudentsPercent} do total</p>
					</article>
				</section>

				{#if errorMessage}
					<p class="feedback error">{errorMessage}</p>
				{/if}

				{#if successMessage}
					<p class="feedback success">{successMessage}</p>
				{/if}

				<section class="students-panel">
					<div class="panel-heading">
						<div>
							<h2>Lista de alunos</h2>
							<p>{filteredStudents.length} resultado(s) encontrados</p>
						</div>
						<button class="primary-button compact" type="button" onclick={openCreateModal}
							>+ Novo aluno</button
						>
					</div>

					<div class="toolbar">
						<label class="search-field">
							<span>Buscar aluno</span>
							<input bind:value={searchTerm} placeholder="Buscar por nome, email ou telefone" />
						</label>
						<label class="filter-field">
							<span>Status</span>
							<select bind:value={statusFilter}>
								<option value="all">Todos</option>
								<option value="active">Ativos</option>
								<option value="inactive">Inativos</option>
							</select>
						</label>
					</div>

					{#if isLoading}
						<p class="empty-state">Carregando alunos...</p>
					{:else if filteredStudents.length === 0}
						<p class="empty-state">Nenhum aluno encontrado.</p>
					{:else}
						<div class="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Aluno</th>
										<th>Contato</th>
										<th>Matricula</th>
										<th>Status</th>
										<th>Acoes</th>
									</tr>
								</thead>
								<tbody>
									{#each filteredStudents as student (student.id)}
										<tr class:selected={student.id === selectedStudent?.id}>
											<td>
												<button
													class="student-cell"
													type="button"
													onclick={() => (selectedStudentId = student.id)}
												>
													<span class="avatar">{getInitials(student.name)}</span>
													<span>
														<strong>{student.name}</strong>
														<small>ID {student.id.slice(0, 8)}</small>
													</span>
												</button>
											</td>
											<td>
												<div class="contact-cell">
													<strong>{student.phone}</strong>
													<small>{student.email}</small>
												</div>
											</td>
											<td>{formatDate(student.enrollmentDate)}</td>
											<td>
												<span class:inactive={student.status === 'inactive'} class="status-badge">
													<span></span>
													{student.status === 'active' ? 'Ativo' : 'Inativo'}
												</span>
											</td>
											<td>
												<div class="row-actions">
													<button type="button" onclick={() => startEditing(student)}>Editar</button
													>
													<button
														class="danger"
														type="button"
														onclick={() => deleteStudent(student)}
													>
														Excluir
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</section>

				{#if selectedStudent}
					<section class="details-strip" aria-label="Aluno selecionado">
						<div>
							<span class="avatar large">{getInitials(selectedStudent.name)}</span>
							<div>
								<h2>{selectedStudent.name}</h2>
								<p>{selectedStudent.status === 'active' ? 'Aluno ativo' : 'Aluno inativo'}</p>
							</div>
						</div>
						<dl>
							<div>
								<dt>Telefone</dt>
								<dd>{selectedStudent.phone}</dd>
							</div>
							<div>
								<dt>Email</dt>
								<dd>{selectedStudent.email}</dd>
							</div>
							<div>
								<dt>Nascimento</dt>
								<dd>{formatDate(selectedStudent.birthDate)}</dd>
							</div>
						</dl>
					</section>
				{/if}
			{:else}
				<section class="coming-soon" aria-label={`${activeViewInfo.title} em breve`}>
					<span class="coming-soon-dot" aria-hidden="true"></span>
					<p class="eyebrow">Em breve</p>
					<h2>{activeViewInfo.title}</h2>
					<p>{activeViewInfo.description}</p>
				</section>
			{/if}
		</main>
	</div>
{/if}

{#if isAuthenticated && isStudentModalOpen}
	<div class="modal-backdrop">
		<button
			class="backdrop-close"
			type="button"
			aria-label="Fechar modal"
			onclick={closeStudentModal}
		></button>
		<div
			class="student-modal"
			aria-labelledby="student-modal-title"
			role="dialog"
			aria-modal="true"
		>
			<header>
				<div>
					<h2 id="student-modal-title">{isEditing ? 'Editar aluno' : 'Novo aluno'}</h2>
					<p>{isEditing ? 'Atualize os dados do cadastro.' : 'Cadastre um novo aluno.'}</p>
				</div>
				<button class="icon-button" type="button" aria-label="Fechar" onclick={closeStudentModal}
					>x</button
				>
			</header>

			<form onsubmit={(event) => event.preventDefault()}>
				<label>
					<span>Nome</span>
					<input bind:value={form.name} maxlength="120" required />
				</label>

				<label>
					<span>Email</span>
					<input bind:value={form.email} maxlength="160" required type="email" />
				</label>

				<label>
					<span>Telefone</span>
					<input bind:value={form.phone} maxlength="30" required />
				</label>

				<div class="field-grid">
					<label>
						<span>Nascimento</span>
						<input bind:value={form.birthDate} type="date" />
					</label>

					<label>
						<span>Matricula</span>
						<input bind:value={form.enrollmentDate} type="date" />
					</label>
				</div>

				<label>
					<span>Status</span>
					<select bind:value={form.status}>
						<option value="active">Ativo</option>
						<option value="inactive">Inativo</option>
					</select>
				</label>

				<footer>
					<button class="secondary-button" type="button" onclick={closeStudentModal}
						>Cancelar</button
					>
					<button
						class="primary-button"
						disabled={isSubmitting}
						type="button"
						onclick={saveStudent}
					>
						{isSubmitting ? 'Salvando...' : isEditing ? 'Salvar edicao' : 'Cadastrar'}
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<style>
	.auth-shell {
		display: grid;
		min-height: 100vh;
		grid-template-columns: minmax(0, 1fr) minmax(360px, 460px);
		gap: 48px;
		align-items: center;
		background: linear-gradient(135deg, rgb(17 24 39 / 0.96), rgb(17 24 39 / 0.88)), #111827;
		padding: 48px;
	}

	.auth-hero {
		max-width: 620px;
		color: #ffffff;
	}

	.auth-hero .eyebrow {
		color: #22c55e;
	}

	.auth-hero h1 {
		margin-top: 14px;
		color: #ffffff;
		font-size: 3rem;
		line-height: 1.04;
	}

	.auth-hero p:last-child {
		max-width: 540px;
		margin-top: 18px;
		color: #d1d5db;
		font-size: 1.05rem;
		line-height: 1.7;
	}

	.auth-brand-mark {
		display: block;
		width: 58px;
		height: 58px;
		border-radius: 999px;
		background:
			radial-gradient(circle at center, #22c55e 0 34%, transparent 36%), rgb(34 197 94 / 0.16);
	}

	.auth-card {
		border: 1px solid rgb(255 255 255 / 0.16);
		border-radius: 8px;
		background: #ffffff;
		padding: 18px;
		box-shadow: 0 24px 90px rgb(0 0 0 / 0.24);
	}

	.auth-tabs {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		border-radius: 8px;
		background: #f3f4f6;
		padding: 6px;
	}

	.auth-tabs button {
		min-height: 40px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		font-weight: 900;
	}

	.auth-tabs button.active {
		background: #ffffff;
		color: #111827;
		box-shadow: 0 1px 4px rgb(17 24 39 / 0.12);
	}

	.auth-form {
		display: grid;
		gap: 16px;
		padding-top: 22px;
	}

	.auth-form h2 {
		color: #111827;
		font-size: 1.25rem;
	}

	.auth-form p {
		margin-top: 6px;
		color: #6b7280;
	}

	.app-shell {
		display: grid;
		min-height: 100vh;
		grid-template-columns: 260px minmax(0, 1fr);
		background: #f6f7f9;
	}

	.sidebar {
		position: sticky;
		top: 0;
		height: 100vh;
		background: #111827;
		padding: 24px 18px;
		color: #ffffff;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 8px 28px;
	}

	.brand-mark {
		display: inline-grid;
		width: 42px;
		height: 42px;
		place-items: center;
		border-radius: 999px;
		background: rgb(22 163 74 / 0.16);
	}

	.brand-mark span {
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: #16a34a;
	}

	.brand strong,
	.brand div span {
		display: block;
	}

	.brand div span {
		color: #9ca3af;
		font-size: 0.84rem;
	}

	.nav {
		display: grid;
		gap: 6px;
	}

	.logout-button {
		width: calc(100% - 16px);
		min-height: 40px;
		margin: 28px 8px 0;
		border: 1px solid rgb(255 255 255 / 0.12);
		border-radius: 8px;
		background: rgb(255 255 255 / 0.06);
		color: #d1d5db;
		cursor: pointer;
		font-weight: 900;
	}

	.logout-button:hover {
		background: rgb(255 255 255 / 0.1);
		color: #ffffff;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 44px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		padding: 0 10px;
		color: #d1d5db;
		font-weight: 800;
		text-align: left;
	}

	.nav-item:hover,
	.nav-item.active {
		background: #1f2937;
		color: #ffffff;
	}

	.nav-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #6b7280;
		box-shadow: 0 0 0 5px rgb(255 255 255 / 0.05);
	}

	.nav-item.active .nav-dot {
		background: #16a34a;
		box-shadow: 0 0 0 5px rgb(22 163 74 / 0.14);
	}

	.teacher-box {
		margin: 28px 8px 0;
		border-top: 1px solid rgb(255 255 255 / 0.1);
		padding-top: 18px;
	}

	.teacher-box strong,
	.teacher-box span {
		display: block;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.teacher-box strong {
		color: #ffffff;
		font-size: 0.9rem;
	}

	.teacher-box span {
		margin-top: 4px;
		color: #9ca3af;
		font-size: 0.8rem;
	}

	.content {
		width: min(1180px, calc(100% - 48px));
		margin: 0 auto;
		padding: 34px 0 44px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 22px;
	}

	.eyebrow,
	h1,
	h2,
	p {
		margin: 0;
	}

	.eyebrow {
		margin-bottom: 6px;
		color: #16a34a;
		font-size: 0.78rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	h1 {
		color: #111827;
		font-size: 2rem;
		line-height: 1.1;
	}

	.page-header p,
	.panel-heading p,
	.student-modal p,
	.details-strip p {
		margin-top: 6px;
		color: #6b7280;
	}

	.primary-button,
	.secondary-button,
	.row-actions button,
	.icon-button {
		min-height: 38px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #ffffff;
		color: #111827;
		cursor: pointer;
		font-weight: 900;
	}

	.primary-button {
		border-color: #16a34a;
		background: #16a34a;
		padding: 0 16px;
		color: #ffffff;
	}

	.primary-button.compact {
		min-height: 36px;
	}

	.primary-button.full {
		width: 100%;
		min-height: 44px;
	}

	.secondary-button {
		padding: 0 14px;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.65;
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
		margin-bottom: 18px;
	}

	.metric-card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #ffffff;
		padding: 18px;
	}

	.metric-label {
		display: block;
		color: #6b7280;
		font-size: 0.78rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.metric-card strong {
		display: block;
		margin-top: 18px;
		color: #111827;
		font-size: 2rem;
	}

	.metric-card p {
		margin-top: 4px;
		color: #6b7280;
	}

	.feedback {
		margin-bottom: 16px;
		border-radius: 8px;
		padding: 12px 14px;
		font-weight: 800;
	}

	.feedback.error {
		background: #fee2e2;
		color: #991b1b;
	}

	.feedback.success {
		background: #dcfce7;
		color: #166534;
	}

	.students-panel,
	.details-strip {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #ffffff;
	}

	.panel-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid #e5e7eb;
		padding: 18px;
	}

	.panel-heading h2,
	.details-strip h2,
	.coming-soon h2,
	.student-modal h2 {
		color: #111827;
		font-size: 1rem;
	}

	.coming-soon {
		display: grid;
		min-height: 420px;
		place-items: center;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #ffffff;
		padding: 48px 24px;
		text-align: center;
	}

	.coming-soon .eyebrow {
		margin-top: 18px;
	}

	.coming-soon h2 {
		margin-top: 8px;
		font-size: 1.8rem;
	}

	.coming-soon p:last-child {
		max-width: 520px;
		margin-top: 10px;
		color: #6b7280;
	}

	.coming-soon-dot {
		width: 64px;
		height: 64px;
		border-radius: 999px;
		background: radial-gradient(circle at center, #16a34a 0 32%, transparent 34%), #dcfce7;
	}

	.toolbar {
		display: grid;
		grid-template-columns: minmax(240px, 1fr) 190px;
		gap: 12px;
		border-bottom: 1px solid #e5e7eb;
		padding: 14px 18px;
	}

	label {
		display: grid;
		gap: 6px;
		color: #374151;
		font-size: 0.82rem;
		font-weight: 900;
	}

	input,
	select {
		width: 100%;
		min-height: 40px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #ffffff;
		padding: 8px 10px;
		color: #111827;
	}

	input:focus,
	select:focus {
		border-color: #16a34a;
		outline: 3px solid #dcfce7;
	}

	.password-field {
		position: relative;
		display: block;
	}

	.password-field input {
		padding-right: 46px;
	}

	.password-toggle {
		position: absolute;
		top: 50%;
		right: 8px;
		display: grid;
		width: 32px;
		height: 32px;
		min-height: 32px;
		place-items: center;
		border: 0;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		transform: translateY(-50%);
	}

	.password-toggle:hover {
		background: #f3f4f6;
	}

	.password-toggle span {
		position: relative;
		width: 18px;
		height: 12px;
		border: 2px solid #6b7280;
		border-radius: 999px / 720px;
	}

	.password-toggle span::after {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: #6b7280;
		content: '';
		transform: translate(-50%, -50%);
	}

	.password-toggle span::before {
		position: absolute;
		top: 50%;
		left: -2px;
		width: 22px;
		height: 2px;
		border-radius: 999px;
		background: #6b7280;
		content: '';
		transform: rotate(-35deg);
		transform-origin: center;
	}

	.password-toggle span.visible {
		border-color: #16a34a;
	}

	.password-toggle span.visible::after {
		background: #16a34a;
	}

	.password-toggle span.visible::before {
		display: none;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		border-bottom: 1px solid #f0f2f4;
		padding: 14px 18px;
		text-align: left;
		vertical-align: middle;
		white-space: nowrap;
	}

	th {
		color: #6b7280;
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	tr.selected td {
		background: #f0fdf4;
	}

	.student-cell {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		border: 0;
		background: transparent;
		padding: 0;
		color: #111827;
		cursor: pointer;
		text-align: left;
	}

	.student-cell strong,
	.contact-cell strong {
		display: block;
		color: #111827;
	}

	.student-cell small,
	.contact-cell small {
		display: block;
		margin-top: 3px;
		color: #6b7280;
	}

	.avatar {
		display: inline-grid;
		width: 40px;
		height: 40px;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 8px;
		background: #e5e7eb;
		color: #111827;
		font-size: 0.78rem;
		font-weight: 900;
	}

	.avatar.large {
		width: 48px;
		height: 48px;
		background: #16a34a;
		color: #ffffff;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border-radius: 999px;
		background: #dcfce7;
		padding: 6px 10px;
		color: #166534;
		font-size: 0.78rem;
		font-weight: 900;
	}

	.status-badge span {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: #16a34a;
	}

	.status-badge.inactive {
		background: #f3f4f6;
		color: #4b5563;
	}

	.status-badge.inactive span {
		background: #9ca3af;
	}

	.row-actions {
		display: flex;
		gap: 8px;
	}

	.row-actions button {
		padding: 0 10px;
	}

	.row-actions .danger {
		color: #991b1b;
	}

	.empty-state {
		padding: 28px 18px;
		color: #6b7280;
	}

	.details-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		margin-top: 18px;
		padding: 18px;
	}

	.details-strip > div {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
		margin: 0;
	}

	dt {
		color: #6b7280;
		font-size: 0.76rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	dd {
		margin: 4px 0 0;
		color: #111827;
		overflow-wrap: anywhere;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		background: rgb(17 24 39 / 0.48);
		padding: 20px;
	}

	.backdrop-close {
		position: absolute;
		inset: 0;
		border: 0;
		background: transparent;
		cursor: default;
	}

	.student-modal {
		position: relative;
		z-index: 1;
		width: min(480px, 100%);
		border-radius: 8px;
		background: #ffffff;
		box-shadow: 0 24px 80px rgb(17 24 39 / 0.28);
	}

	.student-modal header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid #e5e7eb;
		padding: 18px;
	}

	.icon-button {
		width: 36px;
		min-height: 36px;
		padding: 0;
	}

	.student-modal form {
		display: grid;
		gap: 14px;
		padding: 18px;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.student-modal footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding-top: 4px;
	}

	@media (max-width: 980px) {
		.auth-shell {
			grid-template-columns: 1fr;
			gap: 28px;
			padding: 28px;
		}

		.auth-hero h1 {
			font-size: 2.25rem;
		}

		.app-shell {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
			height: auto;
			padding: 16px;
		}

		.nav {
			display: flex;
			overflow-x: auto;
		}

		.nav-item {
			flex: 0 0 auto;
			justify-content: center;
		}

		.content {
			width: min(100% - 28px, 1180px);
		}

		.details-strip,
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		dl,
		.metrics {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 680px) {
		.auth-shell {
			padding: 18px;
		}

		.auth-hero h1 {
			font-size: 1.8rem;
		}

		h1 {
			font-size: 1.65rem;
		}

		.toolbar,
		.field-grid {
			grid-template-columns: 1fr;
		}

		th:nth-child(2),
		td:nth-child(2),
		th:nth-child(3),
		td:nth-child(3) {
			display: none;
		}

		.row-actions {
			flex-direction: column;
		}

		.page-header .primary-button,
		.panel-heading .primary-button {
			width: 100%;
		}
	}
</style>
