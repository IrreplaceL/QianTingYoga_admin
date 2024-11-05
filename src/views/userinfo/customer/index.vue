<template>
  <el-card shadow="never" class="card">
    <!-- 工具栏：搜索和添加客户按钮 -->
    <el-form :inline="true" :model="searchParams" class="toolbar">
      <el-form-item label="客户名：" prop="username">
        <el-input
          v-model="searchParams.username"
          placeholder="请输入客户名"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item label="手机号码：" prop="phoneNumber">
        <el-input
          v-model="searchParams.phoneNumber"
          placeholder="请输入手机号码"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="fetchUserList"
          >搜索</el-button
        >
        <el-button type="success" :icon="Plus" @click="openAddUserDialog"
          >添加客户</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 客户信息表格 -->
    <div class="table-container">
      <el-table
        :data="paginatedUserList"
        border
        row-key="user_id"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="user_id" label="客户ID" min-width="100" />
        <el-table-column prop="username" label="客户名" min-width="120" />
        <el-table-column prop="phone_number" label="手机号码" min-width="120" />
        <el-table-column prop="gender" label="性别" min-width="80">
          <template #default="{ row }">
            <span>{{ row.gender === "M" ? "男" : "女" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avatar_url" label="客户头像" min-width="120">
          <template #default="{ row }">
            <el-image
              :src="row.avatar_url"
              alt="客户头像"
              style="width: 50px; height: 50px"
            />
          </template>
        </el-table-column>

        <el-table-column prop="role" label="身份类型" min-width="100">
          <template #default="{ row }">
            <span>{{ roleMap[row.role] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="160" />
        <el-table-column prop="updated_at" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="deleteUser(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <!-- 编辑和新增客户对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="480px"
      :before-close="closeDialog"
    >
      <el-form
        ref="userFormRef"
        :model="currentUser"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="客户名" prop="username">
          <el-input
            v-model="currentUser.username"
            placeholder="请输入客户名"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="currentUser.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码"
            show-password
          >
            <template #suffix>
              <el-icon @click="togglePasswordVisibility">
                <component :is="passwordVisible ? Eye : EyeSlash" />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="手机号码" prop="phone_number">
          <el-input
            v-model="currentUser.phone_number"
            placeholder="请输入手机号码"
            clearable
          />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="currentUser.gender" placeholder="请选择性别">
            <el-option label="男" value="M" />
            <el-option label="女" value="F" />
          </el-select>
        </el-form-item>

        <!-- 上传客户头像 -->
        <el-form-item label="客户头像" prop="avatar_url">
          <el-upload
            action="/upload/avatar"
            :on-success="handleAvatarSuccess"
            :limit="1"
            :show-file-list="false"
          >
            <el-button>点击上传</el-button>
            <div v-if="currentUser.avatar_url" style="margin-top: 10px">
              <el-image
                :src="currentUser.avatar_url"
                alt="客户头像"
                style="width: 100px; height: 100px"
              />
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="身份类型" prop="role">
          <el-input v-model="roleDisplay" :disabled="true" />
        </el-form-item>

        <el-form-item label="创建时间" prop="created_at">
          <el-date-picker
            v-model="currentUser.created_at"
            type="datetime"
            placeholder="选择创建时间"
          />
        </el-form-item>

        <el-form-item label="更新时间" prop="updated_at">
          <el-date-picker
            v-model="currentUser.updated_at"
            type="datetime"
            placeholder="选择更新时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed ,onMounted} from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import axios from 'axios';

const searchParams = reactive({ username: "", phoneNumber: "" });

const userList = ref([

]);

const fetchUserData = async () => {
  try {
    const response = await axios.get('http://localhost:1031/user/userInformationList');
    userList.value = response.data.data.map(user => ({
      user_id: user.userId,
      username: user.username,
      phone_number: user.phone,
      gender: user.gender,
      avatar: user.avatar,
      created_at: user.createTime,
      updated_at: user.updateTime,
      role: user.identity
    })); // 映射后端返回的数据
    console.log('Data fetched successfully:', userList.value);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchUserData);

const roleMap = { 0: "管理员", 1: "教师", 2: "客户" };

const isDialogVisible = ref(false);
const dialogTitle = ref("");
const userFormRef = ref();
const currentUser = reactive({
  user_id: null,
  username: "",
  password: "",
  phone_number: "",
  gender: "M",
  avatar_url: "",
  role: 0,
  created_at: "",
  updated_at: ""
});
const rules = {
  username: [{ required: true, message: "请输入客户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  phone_number: [
    { required: true, message: "请输入手机号码", trigger: "blur" }
  ],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  avatar_url: [{ required: true, message: "请上传客户头像", trigger: "blur" }],
  role: [{ required: true, message: "请选择身份类型", trigger: "change" }],
  created_at: [
    { required: true, message: "请选择创建时间", trigger: "change" }
  ],
  updated_at: [{ required: true, message: "请选择更新时间", trigger: "change" }]
};

// 身份类型的显示文本
const roleDisplay = computed(() => {
  return roleMap[currentUser.role];
});

// 头像上传成功后处理
function handleAvatarSuccess(response) {
  currentUser.avatar_url = response.url; // 假设服务器返回 URL 字段
  ElMessage.success("头像上传成功");
}

// 分页参数
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10
});

// 过滤并分页显示客户数据
const filteredUserList = computed(() => {
  return userList.value.filter(
    user =>
    user.role === 2 &&
      (searchParams.username
        ? user.username.includes(searchParams.username)
        : true) &&
      (searchParams.phoneNumber
        ? user.phone_number.includes(searchParams.phoneNumber)
        : true)
  );
});

const paginatedUserList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  pagination.total = filteredUserList.value.length;
  return filteredUserList.value.slice(start, end);
});

// 搜索功能
function fetchUserList() {
  ElMessage.success("搜索成功！");
}

// 新增客户
function openAddUserDialog() {
  Object.assign(currentUser, {
    user_id: null,
    username: "",
    password: "",
    phone_number: "",
    gender: "M",
    avatar_url: "",
    role: 0,
    created_at: "",
    updated_at: ""
  });
  dialogTitle.value = "新增客户";
  isDialogVisible.value = true;
}

// 编辑客户
function openEditDialog(row) {
  Object.assign(currentUser, row);
  dialogTitle.value = "编辑客户";
  isDialogVisible.value = true;
}

// 提交表单
function submitForm() {
  userFormRef.value.validate(valid => {
    if (valid) {
      if (currentUser.user_id) {
        const index = userList.value.findIndex(
          user => user.user_id === currentUser.user_id
        );
        if (index !== -1) {
          Object.assign(userList.value[index], currentUser);
          ElMessage.success("客户信息更新成功！");
        }
      } else {
        currentUser.user_id = Date.now();
        userList.value.push({ ...currentUser });
        ElMessage.success("客户新增成功！");
      }
      isDialogVisible.value = false;
    }
  });
}

// 删除客户
function deleteUser(row) {
  const index = userList.value.findIndex(user => user.user_id === row.user_id);
  if (index !== -1) {
    userList.value.splice(index, 1);
    pagination.total = userList.value.length;
    ElMessage.success("删除成功！");
  }
}

// 分页事件
function onSizeChange(size) {
  pagination.pageSize = size;
}

function onCurrentChange(page) {
  pagination.currentPage = page;
}

// 关闭对话框
function closeDialog() {
  isDialogVisible.value = false;
  userFormRef.value.resetFields();
}
</script>

<style scoped>
.card {
  margin: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination-container {
  text-align: right;
}
.input-width {
  width: 200px;
}
</style>
