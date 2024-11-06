<template>
  <el-card shadow="never" class="card">
    <!-- 工具栏：搜索和添加课程按钮 -->
    <el-form :inline="true" :model="searchParams" class="toolbar">
      <!-- 课程类别输入框 -->
      <el-form-item label="课程类别：" prop="category">
        <el-input
          v-model="searchParams.category"
          placeholder="请输入课程类别"
          clearable
          class="input-width"
        />
      </el-form-item>

      <!-- 关键字输入 -->
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="searchParams.keyword"
          placeholder="请输入关键词"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="fetchCourseList"
          >搜索</el-button
        >
        <el-button type="success" :icon="Plus" @click="openAddCourseDialog"
          >添加课程</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 课程信息表格 -->
    <div class="table-container">
      <el-table
        :data="courseList"
        border
        row-key="course_id"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="course_name" label="课程名称" min-width="120" />
        <el-table-column
          prop="course_content"
          label="课程内容"
          min-width="200"
        />
        <el-table-column prop="category" label="课程类别" min-width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="deleteCourse(row)"
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

    <!-- 编辑和新增课程对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="480px"
      :before-close="closeDialog"
    >
      <el-form
        ref="courseFormRef"
        :model="currentCourse"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="课程名称" prop="course_name">
          <el-input
            v-model="currentCourse.course_name"
            placeholder="请输入课程名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="课程内容" prop="course_content">
          <el-input
            v-model="currentCourse.course_content"
            type="textarea"
            placeholder="请输入课程内容"
            clearable
          />
        </el-form-item>
        <el-form-item label="课程类别" prop="category">
          <el-input
            v-model="currentCourse.category"
            placeholder="请输入课程类别"
            clearable
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="created_at">
          <el-date-picker
            v-model="currentCourse.created_at"
            type="datetime"
            placeholder="选择创建时间"
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
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import { onMounted } from 'vue';
import axios from 'axios';

const searchParams = reactive({ category: "", keyword: "" });

const courseList = ref([
]);

const isDialogVisible = ref(false);
const dialogTitle = ref("");
const courseFormRef = ref();
const currentCourse = reactive({
  id: null,
  course_name: "",
  course_content: "",
  category: "",
  created_at: ""
});
const rules = {
  course_name: [{ required: true, message: "请输入课程名称", trigger: "blur" }],
  course_content: [
    { required: true, message: "请输入课程内容", trigger: "blur" }
  ],
  category: [{ required: true, message: "请输入课程类别", trigger: "blur" }],
  created_at: [{ required: true, message: "请选择创建时间", trigger: "change" }]
};
const fetchCourseData = async ()=> {
  try {
    const response = await axios.get('http://localhost:1031/course/courseInformationList');

    // 假设后端响应数据是符合你给出的格式
    courseList.value = response.data.data.map(course => ({
      course_id: course.courseId,
      course_name: course.courseName,
      course_content: course.courseContent,
      category: course.category,
      created_at: course.createTime,
      updated_at: course.updateTime
    }));



    console.log('Data fetched successfully:', paginatedCourseList.value);
  } catch (error) {
    console.error('Error fetching course data:', error);
  }
};
// 页面加载时请求数据
onMounted(() => {
  fetchCourseData();
});
// 分页参数
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10
});

// 过滤并分页显示课程数据
const filteredCourseList = computed(() => {
  return courseList.value.filter(
    course =>
      (searchParams.category
        ? course.category.includes(searchParams.category)
        : true) &&
      (searchParams.keyword
        ? course.course_name.includes(searchParams.keyword)
        : true)
  );
});

const paginatedCourseList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  pagination.total = filteredCourseList.value.length;
  return filteredCourseList.value.slice(start, end);
});

// 搜索功能
function fetchCourseList() {
  ElMessage.success("搜索成功！");
}

// 新增课程
function openAddCourseDialog() {
  Object.assign(currentCourse, {
    id: null,
    course_name: "",
    course_content: "",
    category: "",
    created_at: ""
  });
  dialogTitle.value = "新增课程";
  isDialogVisible.value = true;
}

// 编辑课程
function openEditDialog(row) {
  Object.assign(currentCourse, row);
  dialogTitle.value = "编辑课程";
  isDialogVisible.value = true;
}

// 提交表单

function submitForm() {
  courseFormRef.value.validate(valid => {
    if (valid) {
      if (currentCourse.id) {
        // 编辑课程
        const index = courseList.value.findIndex(
          course => course.id === currentCourse.id
        );
        if (index !== -1) courseList.value[index] = { ...currentCourse };

        // 发送编辑请求
        axios
          .post('http://localhost:1031/course/updateCourse', currentCourse)  // 编辑课程接口
          .then(response => {
            ElMessage.success("编辑成功！");
          })
          .catch(error => {
            ElMessage.error("编辑失败！");
            console.error(error);
          });
      } else {
        // 新增课程
        const newCourse = { ...currentCourse, id: Date.now() };

        // 先将新课程加入课程列表
        courseList.value.push(newCourse);
        pagination.total = courseList.value.length;

        // 发送新增请求
        axios
          .post('http://localhost:1031/course/updataCourse', newCourse)  // 新增课程接口
          .then(response => {
            ElMessage.success("新增课程成功！");
          })
          .catch(error => {
            // 如果新增请求失败，移除列表中的新课程，并提示错误
            courseList.value.pop();  // 移除列表中新增的课程
            pagination.total = courseList.value.length;  // 更新分页总数
            ElMessage.error("新增课程失败！");
            console.error(error);
          });
      }

      // 关闭对话框并重置表单
      isDialogVisible.value = false;
      resetForm();
    }
  });
}

// 重置表单
function resetForm() {
  Object.assign(currentCourse, {
    id: null,
    course_name: "",
    course_content: "",
    category: "",
    created_at: ""
  });
}

// 删除课程
function deleteCourse(row) {
  const index = courseList.value.indexOf(row);
  if (index !== -1) {
    courseList.value.splice(index, 1);
    pagination.total = courseList.value.length;
    ElMessage.success("删除成功！");
  }
}

// 分页事件
function onSizeChange(val) {
  pagination.pageSize = val;
}
function onCurrentChange(val) {
  pagination.currentPage = val;
}

// 关闭对话框
function closeDialog() {
  isDialogVisible.value = false;
  resetForm();
}
</script>

<style scoped>
.card {
  padding: 16px;
}
.toolbar {
  margin-bottom: 16px;
}
.table-container {
  margin-top: 16px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
