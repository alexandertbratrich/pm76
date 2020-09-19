<!--

* Patch
  * Migration from Vue 2.6.12 to Vue 3.x
  * visualize age of tasks
  * dueDates on tasks?
  * priorities on tasks?
  * hour logging on tasks?
  * descriptions on tasks?
  * sorting of subtasks
  * sorting of tasks/projects (by name, date, etc.)
  * defcon (global statistics)
  * components
  * Performance Improvements
  * Settings
  * Statistics per Project
  * different columns per project
  * fix rearragments
  * edit subtasks/tags
  * make auto projects-tags when adding a tag when I project is selected
  * sub projects?

* when "wip", then "started x ago"
  * except when dueDate, then that more important
  * when "done", then "finished x ago"
* "no tasks yet" in empty column
* requirements for colums
  * i.e. all subtasks done for "done"
  * i.e. at least 1 subtask done for "wip"
  * force droptargets to decline if it doesn't have requirements

-->

<template>
  <div id="wrapper">
    <!--<div id="debug" v-if="true">
      <p>DragType: {{dragType}} / DragTarget: {{dragTarget}} <span v-if="dragType=='col'">({{kanbanStates[dragTarget]}}/{{kanbanIds[dragTarget]}})</span></p>
      <p>DropTarget: {{dropTarget}} ({{kanbanStates[dropTarget]}}/{{kanbanIds[dropTarget]}}) / DropTargetTask: {{dropTargetTask}}</p>
    </div>-->

    <div class="modal" v-if="taskModalShown">
      <div class="inner">
        <div class="title">
          <p v-if="selectedEdit===undefined">New Task</p>
          <p v-else>Edit Task</p>

          <div class="button" @click="taskModalShown=false; selectedEdit=undefined">
            <img src="~@/assets/times.svg"/>
          </div>
        </div>
        <div class="segment">
          <input v-if="selectedEdit===undefined" type="text" placeholder="Task Title" v-model="newTaskTitle">
          <input v-else type="text" :placeholder="tasks[selectedEdit].title" v-model="editTaskTitle">
        </div>
        <!--<div class="segment">
          <p>State</p>
          <select>
            <option v-for="(s, index) in kanbanStates">{{s}} ({{kanbanIds[index]}})</option>
          </select>
        </div>-->
        <div class="segment">
          <p>Background Color</p>
          
          <div class="picker" v-if="selectedEdit===undefined">
            <div :class="['color', c]" v-for="(c, indexC) in bgColors" @click="newTaskBG = c">
              <img v-if="newTaskBG === c" src="~@/assets/check.svg" />
            </div>
          </div>
          <div class="picker" v-else>
            <div :class="['color', c]" v-for="(c, indexC) in bgColors" @click="editTaskBG = c">
              <img v-if="editTaskBG === c" src="~@/assets/check.svg" />
            </div>
          </div>
        </div>

        <div class="segment"><!-- v-if="selectedEdit===undefined">-->
          <p>Subtasks</p>
          
          <div class="subtask" v-for="(sub, indexS) in editTaskSubtasks">
            <img @click="changeSubtaskState(undefined, indexS)" class="checkbox icon small" src="~@/assets/task.svg" v-if="sub.state===0" />
            <img @click="changeSubtaskState(undefined, indexS)" class="checkbox icon small" src="~@/assets/task_done.svg" v-if="sub.state===1" />
            <p><del v-if="sub.state === 1">{{sub.title}}</del>
              <span v-else>{{sub.title}}</span></p>

            <div class="button secondary" @click="deleteSubtask(indexS)">
              <img src="~@/assets/trash.svg" />
            </div>
          </div>
          <div class="subtask new">
            <input type="text" placeholder="New Subtask..." v-model="newSubtask" @keyup.enter="addNewSubtask()">
          </div>
        </div>
        <!--<div class="segment" v-else>
          <p>Subtasks</p>

          <div class="subtask" v-for="(sub, indexS) in tasks[selectedEdit].subtasks">
            <img @click="changeSubtaskState(selectedEdit, indexS)" class="checkbox icon small" src="~@/assets/task.svg" v-if="sub.state===0" />
            <img @click="changeSubtaskState(selectedEdit, indexS)" class="checkbox icon small" src="~@/assets/task_done.svg" v-if="sub.state===1" />
            <p><del v-if="sub.state === 1">{{sub.title}}</del>
              <span v-else>{{sub.title}}</span></p>
          </div>
          <div class="subtask new">
            <input type="text" placeholder="New Subtask..." v-model="editTaskNewSubtask" @keyup.enter="addNewSubtask(selectedEdit)">
          </div>
        </div>-->

        <div class="segment">
          <p>Tags</p>
          <div class="tags">
            <div class="tag" v-for="(t, indexT) in editTaskTags">
              <p>{{t}}</p>
              <div class="button" @click="deleteTag(indexT)">
                <img src="~@/assets/times.svg">
              </div>
            </div>
            <div class="tag">
              <input type="text" placeholder="New Tag..." v-model="editTaskNewTag" @keyup="convertTags()">
            </div>
          </div>
        </div>

        <div v-if="selectedEdit===undefined" class="segment right">
          <div class="button" @click="addNewTask()">
            <img src="~@/assets/plus.svg" />
            <p>Add Task</p>
          </div>
        </div>
        <div v-else class="segment space">
          <div class="button secondary" @click="deleteTask()">
            <img src="~@/assets/trash.svg" />
            <p>Delete Task</p>
          </div>
          <div class="button" @click="saveEdits()">
            <img src="~@/assets/save.svg" />
            <p>Save Edits</p>
          </div>
        </div>
      </div>
    </div>

    <div id="top">
      <div class="button" @click="projectListShown=!projectListShown">
        <img class="icon" src="~@/assets/list.svg"/>
      </div>

      <div id="search">
        <!--<img class="icon" src="~@/assets/settings.svg"/>-->
        <input type="text" placeholder="Search..." v-model="searchTerm">
      </div>

      <!--<div id="defcon">
        <div class="big">
          <p>5</p>
        </div>

        <p><small><small>todo: {{(countTasks(0) / tasks.length * 100).toFixed(2)}}% ({{countTasks(0)}}T) - wip: {{(countTasks(1) / tasks.length * 100).toFixed(2)}}% ({{countTasks(1)}}T) <br/> done: {{(countTasks(2) / tasks.length * 100).toFixed(2)}}% ({{countTasks(2)}}T) - total: 100% ({{tasks.length}}T)</small></small></p>
      </div>-->

      <!--<div class="trash button"
        v-if="dragTarget !== undefined"
        @drop="drop($event, undefined)"
        @dragenter.prevent
        @dragover.prevent="dragoverTask($event, -2)">
        <img class="icon" src="~@/assets/trash.svg"/>
        <p>Delete</p>
      </div>-->

      <div class="button" @click="settingsShown=true">
        <img class="icon" src="~@/assets/settings.svg"/>
      </div>
    </div>

    <div id="middle">
      <div id="projectlist" :style="{'width': 'calc(100% / ' + (kanbanStates.length + 1) + ')'}" v-if="projectListShown">
        <div class="title">
          <p>Projectlist</p>
        </div>

        <div :class="['project', {'selected': selectedProject===index}]" v-for="(pr, index) in projects" @click="selectProject(index)">
          <div class="title"><p>{{pr.title}}</p></div>
          <div class="footer"><p>{{textualDateDifference(pr.addDate)}}</p></div>
        </div>

        <div class="project new">
          <input type="text" placeholder="New Project..." v-model="newProjectTitle" @keyup.enter="addNewProject()">
        </div>
      </div>

      <div id="kanban" :style="{'width': 'calc(100% / ' + (kanbanStates.length) + ' * ' + (kanbanStates.length) + ')'}">
        <div :class="['column', {'target': dropTarget == kanbanIds[index]}]" v-for="(col, index) in kanbanStates" :style="{'width': 'calc(100% / ' + (kanbanStates.length) + ' - 8px)'}"
          @drop="drop($event, kanbanIds[index])"
          @dragover.prevent="dragover($event, kanbanIds[index])"
          @dragenter.prevent>
          <div class="title" @dragstart="dragstart($event, 'col', kanbanIds[index])"
            @dragover.prevent="dragover($event, kanbanIds[index])"
            draggable>
            <p>{{col}}</p>

            <div class="button" @click="taskModalShown=true">
              <img class="icon" src="~@/assets/plus.svg"/>
            </div>
          </div>
          <div class="inner">
            <div class="list">
              <div :class="['task', {'target': dropTargetTask == index2}, t.bg]" v-for="(t, index2) in tasks"
                :key="index2"
                :data="index2"
                v-if="t.state === kanbanIds[index] && filterTasks(t) === true"
                @dragstart="dragstart($event, 'task', index2)"
                @dragover.prevent="dragoverTask($event, index2)"
                draggable>
                <div class="inner">
                  <!--<div class="title" v-if="selected === index2">
                    <input type="text" :placeholder="t.title" v-model="editTask">
                    <div @click="selectTask(index2)">
                      <img class="icon" src="~@/assets/chevron_up.svg"/>
                    </div>
                  </div>-->
                  <div class="title" v-if="selected === index2">
                    <p>{{t.title}}</p>

                    <div class="button" @click="selectTaskForEdit(index2)">
                      <img class="icon" src="~@/assets/edit.svg"/>
                    </div>

                    <div class="button" @click="selectTask(index2)">
                      <img class="icon" src="~@/assets/chevron_up.svg"/>
                    </div>
                  </div>
                  <div class="title" v-else @click="selectTask(index2)">
                    <p>{{t.title}}</p>
                  </div>

                  <div class="subtasklist" v-if="selected === index2">
                    <div class="subtask" v-for="(sub, index3) in t.subtasks" @click="changeSubtaskState(index2, index3)">
                      <img class="checkbox icon small" src="~@/assets/task.svg" v-if="sub.state===0" />
                      <img class="checkbox icon small" src="~@/assets/task_done.svg" v-if="sub.state===1" />
                      <p><del v-if="sub.state === 1">{{sub.title}}</del>
                         <span v-else>{{sub.title}}</span></p>
                    </div>
                    <div class="subtask none">
                      <p>No Subtasks</p>
                    </div>
                    <!--<div class="subtask new">
                      <input type="text" placeholder="New Subtask..." v-model="newSubtask" @keyup.enter="addNewSubtask(index2)">
                    </div>-->
                  </div>

                  <div class="footer">
                    <div class="segment" v-if="t.subtasks !== undefined">
                      <img class="icon small" src="~@/assets/subtasks3.svg"/>
                      <p v-if="t.state===2">{{t.subtasks.length}} Tasks</p>
                      <p v-else>{{calcSubtasks(index2, 1)}}/{{t.subtasks.length}} Tasks</p>
                    </div>
                    <div v-else></div>
                    <div class="segment" v-if="t.dueDate!==undefined">
                      <p>due {{textualDateDifference(t.dueDate)}}</p>
                    </div>
                    <div class="segment" v-else-if="t.editDate!==undefined">
                      <p>edited {{textualDateDifference(t.editDate)}}</p>
                    </div>
                    <div class="segment" v-else>
                      <p>added {{textualDateDifference(t.addDate)}}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div :class="['dropzone', {'target': dropTargetTask == -1 && dropTarget == kanbanIds[index]}]"
              @dragover.prevent="dragoverTask($event, -1)">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" v-if="settingsShown" id="settings">
      <div class="inner">
        <div class="title">
          <p>Settings</p>

          <div class="button" @click="settingsShown=false">
            <p>&times;</p>
          </div>
        </div>
        <div class="segment">
          <p><b>Projects</b></p>
          <div class="item" v-for="(pr, indexP) in projects">
            <p>{{pr.title}}</p>
            <div class="button" @click="deleteProject(indexP)">
              <img src="~@/assets/trash.svg">
            </div>
          </div>
        </div>
        <div class="segment">
          <p><b>Columns</b></p>
          <div class="item" v-for="(col, indexC) in kanbanStates">
            <p>{{col}}</p>
            <div class="button" @click="deleteCol(indexC)">
              <img src="~@/assets/trash.svg">
            </div>
          </div>
          <input type="text" placeholder="New Column..." v-model="newCol" @keyup.enter="addNewCol()">
        </div>
        <!--<div class="segment">
          <p>Autosort Subtasks</p>
          <p>Autosort Tasks</p>

          <p>Column Limits/Requirements</p>

          <p>Automove Tasks when</p>
          <p>Autocolor Tasks</p>
          <p>Subtasks 2 or 3 states?</p>
        </div>-->
      </div>
    </div>
  </div>
</template>

<script>
  // import SystemInformation from './LandingPage/SystemInformation'

  export default {
    name: 'landing-page',
    // components: { SystemInformation },
    data () {
      return {
        startversion: '0.1.814',
        version: '0.1.910',
        kanbanStates: ['todo', 'wip', 'done'],
        kanbanIds: [0, 1, 2],
        bgColors: ['w', 'gr', 'r', 'ro', 'o', 'oy', 'y', 'yg', 'g', 'bg', 'b', 'bv', 'v', 'vr'],
        tasks: [
          { title: 'Drag and Drop', bg: 'ro', state: 2, addDate: '2020-09-07', tags: ['PM 76'] },
          { title: 'Tasks',
            state: 2,
            bg: 'yg',
            addDate: '2020-09-07',
            subtasks: [
              { title: 'Adding Task', state: 1, addDate: '2020-09-07' },
              { title: 'Editing Task', state: 1, addDate: '2020-09-07' },
              { title: 'Deleting Task', state: 1, addDate: '2020-09-07' }
            ],
            tags: ['PM 76']
          },
          { title: 'Make Design', state: 2, bg: 'o', addDate: '2020-09-07', tags: ['PM 76'] },
          { title: 'Restart', state: 2, bg: 'oy', addDate: '2020-09-07', tags: ['PM 76'] },
          { title: 'Projects',
            state: 1,
            bg: 'g',
            addDate: '2020-09-09',
            subtasks: [
              { title: 'adding', state: 1, addDate: '2020-09-09' },
              { title: 'editing', state: 0, addDate: '2020-09-09' },
              { title: 'deleting', state: 0, addDate: '2020-09-09' }
            ],
            tags: ['PM 76']
          },
          { title: 'Column',
            state: 1,
            bg: 'bg',
            addDate: '2020-09-09',
            subtasks: [
              { title: 'adding', state: 1, addDate: '2020-09-09' },
              { title: 'editing', state: 0, addDate: '2020-09-09' },
              { title: 'deleting', state: 0, addDate: '2020-09-09' },
              { title: 'rearrange', state: 1, addDate: '2020-09-09' }
            ],
            tags: ['PM 76']
          },
          { title: 'Subtasks',
            state: 2,
            bg: 'b',
            addDate: '2020-09-09',
            subtasks: [
              { title: 'adding', state: 1, addDate: '2020-09-09' },
              { title: 'editing', state: 0, addDate: '2020-09-09' },
              { title: 'deleting', state: 1, addDate: '2020-09-09' }
            ],
            tags: ['PM 76']
          },
          { title: 'Tags',
            state: 2,
            bg: 'b',
            addDate: '2020-09-16',
            subtasks: [
              { title: 'adding', state: 1, addDate: '2020-09-09' },
              { title: 'editing', state: 0, addDate: '2020-09-09' },
              { title: 'deleting', state: 1, addDate: '2020-09-09' }
            ],
            tags: ['PM 76']
          },
          { title: 'Filter/Sorting',
            state: 2,
            bg: 'b',
            addDate: '2020-09-16',
            subtasks: [
              { title: 'filter tasks', state: 1, addDate: '2020-09-16' },
              { title: 'filter projects', state: 1, addDate: '2020-09-16' }
            ],
            tags: ['PM 76']
          },
          { title: 'Automove Task on start/finish all Subtasks', bg: 'bv', state: 2, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'Change Background Color of Task', bg: 'v', state: 2, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'Save Data with Electron', bg: 'vr', state: 0, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'Minor Design Edits', bg: 'w', state: 1, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'Git Upload', bg: 'gr', state: 0, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'Build and test', bg: 'r', state: 0, addDate: '2020-09-09', tags: ['PM 76'] },
          { title: 'PCT', bg: 'r', state: 2, addDate: '2020-09-18', tags: ['Zimmer'] },
          { title: 'Test', bg: 'r', state: 2, addDate: '2020-09-18', tags: ['Zimmer', 'Masterthesis'] }
        ],
        dragType: undefined,
        dragTarget: undefined,
        dropTarget: undefined,
        dropTargetTask: undefined,
        newSubtask: '',
        selected: undefined,
        selectedEdit: undefined,
        settingsShown: false,
        searchTerm: '',
        newCol: '',
        // task
        taskModalShown: false,
        newTaskTitle: '',
        newTaskBG: 'w',
        // edit task
        editTaskTitle: '',
        editTaskBG: '',
        editTaskSubtasks: [],
        editTaskNewSubtask: '',
        editTaskNewTag: '',
        editTaskTags: [],
        // project
        projects: [
          { title: 'PM 76', state: 0, addDate: '2020-09-16T15:47' },
          { title: 'Masterthesis', state: 0, addDate: '2020-09-18T16:42' },
          { title: 'Zimmer', state: 0, addDate: '2020-09-18T16:43' }
        ],
        selectedProject: undefined,
        projectListShown: true,
        newProjectTitle: ''
      }
    },
    methods: {
      selectProject (index) {
        if (this.selectedProject === index) this.selectedProject = undefined
        else {
          this.selectedProject = index
        }
      },
      convertTags () {
        let splits = this.editTaskNewTag.split(',')
        if (splits.length > 1) {
          let newTag = splits[0].trim()
          if (newTag.length > 0 && !this.editTaskTags.includes(newTag)) {
            this.editTaskTags.push(newTag)
          }
          this.editTaskNewTag = splits[1]
        } else {
          this.editTaskNewTag = splits[0]
        }
      },
      selectTaskForEdit (index) {
        this.selectedEdit = index
        this.editTaskTitle = this.tasks[index].title
        this.editTaskBG = this.tasks[index].bg
        // this.editTaskSubtasks = this.tasks[index].subtasks
        // vue somehow still links to the original array (kinda like a pointer)
        if (this.tasks[index].subtasks !== undefined) {
          this.editTaskSubtasks = JSON.parse(JSON.stringify(this.tasks[index].subtasks))
        } else {
          this.editTaskSubtasks = []
        }
        this.editTaskTags = this.tasks[this.selectedEdit].tags
        if (this.editTaskTags === undefined) this.editTaskTags = []
        this.taskModalShown = true
      },
      saveEdits () {
        console.log('saveEdits')
        if (this.editTaskTitle.trim().length > 0) {
          this.tasks[this.selectedEdit].title = this.editTaskTitle
        }
        this.tasks[this.selectedEdit].bg = this.editTaskBG
        this.tasks[this.selectedEdit].subtasks = this.editTaskSubtasks
        this.tasks[this.selectedEdit].tags = this.editTaskTags
        this.tasks[this.selectedEdit].editDate = new Date().getTime()
        // reset all
        this.taskModalShown = false
        this.selectedEdit = undefined
        this.editTaskSubtasks = []
      },
      deleteTask () {
        let title = this.tasks[this.selectedEdit].title
        let con = confirm('Are you sure you want to delete Task »' + title + '«?')
        if (con === true) {
          this.tasks.splice(this.selectedEdit, 1)
          this.taskModalShown = false
          this.selectedEdit = undefined
        }
      },
      deleteSubtask (index) {
        let title = this.editTaskSubtasks[index].title
        let con = confirm('Are you sure you want to delete Subtask »' + title + '«?')
        if (con === true) {
          this.editTaskSubtasks.splice(index, 1)
        }
      },
      deleteTag (index) {
        let title = this.editTaskTags[index]
        let con = confirm('Are you sure you want to delete Tag »' + title + '«?')
        if (con === true) {
          this.editTaskTags.splice(index, 1)
        }
      },
      selectTask (index) {
        if (this.selected === index) this.selected = undefined
        else { /* if (this.tasks[index].state !== 2) { */
          this.editTasks(this.selected)
          this.selected = index
        }
      },
      getLastTask (state) {
        for (var i = this.tasks.length - 1; i >= 0; i--) {
          if (this.tasks[i].state === state) return i
        }
        return undefined
      },
      countTasks (state) {
        let c = 0
        for (var i = 0; i < this.tasks.length; i++) {
          if (this.tasks[i].state === state) c++
        }
        return c
      },
      dragstart (e, type, item) {
        this.dragType = type
        this.dragTarget = item
      },
      dragover (e, col) {
        this.dropTarget = col
      },
      dragoverTask (e, task) {
        this.dropTargetTask = task
      },
      drop (e, col) {
        if (this.dragType === 'task') {
          // change state if col changed
          if (this.tasks[this.dragTarget].state !== col) {
            this.tasks[this.dragTarget].state = col
          }
          // to, 0, from()
          // this.tasks.splice(this.dragoverTask, 0, this.tasks.splice(this.dragTarget, 1)[0])

          if (this.dropTargetTask === -2) {
            // delete task
            console.log('delete task »' + this.tasks[this.dragTarget].title + '«')
            this.tasks.splice(this.dragTarget, 1)
          } else if (this.dropTargetTask === -1) {
            console.log('add task »' + this.tasks[this.dragTarget].title + '« to end of »' + this.kanbanStates[col] + '«')
            let index = this.getLastTask(this.kanbanIds[col])
            let tempTask = this.tasks[this.dragTarget]
            // take old task...
            this.tasks.splice(this.dragTarget, 1)
            // ...move to new position
            this.tasks.splice(index, 0, tempTask)
            // if the dragged task is selected
            this.selected = -1
            /* if (this.selected === this.dragTarget) this.selected = index
            // unselect to it can't be edited
            if (this.selected === index && this.tasks[index].state === 2) this.selected = -1 */
          } else if (this.dropTargetTask === this.dragTarget) {
            console.log('dont change things')
          } else {
            console.log('move task »' + this.tasks[this.dragTarget].title + '« over »' + this.tasks[this.dropTargetTask].title + '«')
            let tempTask = this.tasks[this.dragTarget]
            // take old task...
            this.tasks.splice(this.dragTarget, 1)
            // ...move to new position
            this.tasks.splice(this.dropTargetTask, 0, tempTask)
            // if the dragged task is selected
            if (this.selected === this.dragTarget) this.selected = this.dropTargetTask
          }
        } else {
          if (this.dragTarget !== this.dropTarget) {
            let tempCol = this.kanbanStates[this.dragTarget]
            let tempColId = this.kanbanIds[this.dragTarget]
            // take old task...
            this.kanbanStates.splice(this.dragTarget, 1)
            this.kanbanIds.splice(this.dragTarget, 1)
            // ...move to new position
            this.kanbanStates.splice(this.dropTarget, 0, tempCol)
            this.kanbanIds.splice(this.dropTarget, 0, tempColId)
          }
        }

        this.dragType = undefined
        this.dragTarget = undefined
        this.dropTarget = undefined
        this.dropTargetTask = undefined
      },
      editTasks (index) {
        if (this.newTaskTitle.trim().length > 0) {
          this.tasks[index].title = this.newTaskTitle.trim()
        }
        this.newTaskTitle = ''
      },
      addNewTask () {
        if (this.newTaskTitle.trim().length > 0) {
          this.tasks.unshift({
            title: this.newTaskTitle.trim(),
            state: 0,
            bg: this.newTaskBG,
            subtasks: this.editTaskSubtasks,
            tags: this.editTaskTags,
            addDate: new Date().getTime()
          })

          this.selected = -1
          this.taskModalShown = false
          this.newTaskTitle = ''
          this.newTaskBG = 'w'
        }
      },
      addNewSubtask () {
        if (this.newSubtask.trim().length > 0) {
          this.editTaskSubtasks.push({
            title: this.newSubtask.trim(),
            state: 0,
            addDate: new Date().getTime()
          })
        }
        this.newSubtask = ''
      },
      addNewProject () {
        if (this.newProjectTitle.trim().length > 0) {
          this.projects.push({
            title: this.newProjectTitle.trim(),
            state: 0,
            addDate: new Date().getTime()
          })
          this.newProjectTitle = ''
        }
      },
      addNewCol () {
        if (this.newCol.trim().length > 0) {
          this.kanbanStates.push(this.newCol.trim())
          this.kanbanIds.push(this.kanbanIds[this.kanbanIds.length - 1] + 1)
          this.newCol = ''
        }
      },
      changeSubtaskState (taskIndex, index) {
        if (taskIndex !== undefined) {
          let val = this.tasks[taskIndex].subtasks[index].state
          if (val === 0) {
            this.tasks[taskIndex].subtasks[index].state = 1
          } else if (val === 1) {
            this.tasks[taskIndex].subtasks[index].state = 0
          }
          this.automoveTask(taskIndex)
        } else {
          let val = this.editTaskSubtasks[index].state
          if (val === 0) {
            this.editTaskSubtasks[index].state = 1
          } else if (val === 1) {
            this.editTaskSubtasks[index].state = 0
          }
        }
      },
      calcSubtasks (taskIndex, state) {
        let c = 0
        for (let i = 0; i < this.tasks[taskIndex].subtasks.length; i++) {
          if (this.tasks[taskIndex].subtasks[i].state === state) {
            c++
          }
        }
        return c
      },
      automoveTask (taskIndex) {
        let c = 0
        for (let i = 0; i < this.tasks[taskIndex].subtasks.length; i++) {
          if (this.tasks[taskIndex].subtasks[i].state === 1) {
            c++
          }
        }

        if (c === this.tasks[taskIndex].subtasks.length) {
          this.tasks[taskIndex].state = 2
        } else if (c === 0) {
          this.tasks[taskIndex].state = 0
        } else {
          this.tasks[taskIndex].state = 1
        }
      },
      filterTasks (task) {
        console.log('filterTasks')
        let projectTitle = ''
        let trimmedTerm = this.searchTerm.toLowerCase().trim()
        if (this.selectedProject !== undefined) {
          projectTitle = this.projects[this.selectedProject].title.toLowerCase().trim()
        }
        // check tags for project title
        let check = false
        if (projectTitle.length > 0) {
          if (task.tags !== undefined) {
            for (let j = 0; j < task.tags.length; j++) {
              if (task.tags[j].toLowerCase().includes(projectTitle)) {
                check = true
                break
              }
            }
          }
        }
        if (check === false && projectTitle.length > 0) return false
        // check tags for searchterm
        if (task.tags !== undefined) {
          for (let j = 0; j < task.tags.length; j++) {
            if (task.tags[j].toLowerCase().includes(trimmedTerm)) {
              return true
            }
          }
        }
        // check title
        if (task.title.toLowerCase().includes(trimmedTerm)) {
          return true
        }
        // check subtasks
        if (task.subtasks !== undefined) {
          for (let i = 0; i < task.subtasks.length; i++) {
            if (task.subtasks[i].title.toLowerCase().includes(trimmedTerm)) {
              return true
            }
          }
        }

        return false
      },
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    margin: 0;
    padding: 0;
  }

  p {
    color: #EEE;
    cursor: default;
    font-family: sans-serif;

    -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
       -khtml-user-select: none; /* Konqueror HTML */
         -moz-user-select: none; /* Firefox */
          -ms-user-select: none; /* Internet Explorer/Edge */
              user-select: none; /* Non-prefixed version, currently
                                    supported by Chrome and Opera */
  }

  span, img, input {
    -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
       -khtml-user-select: none; /* Konqueror HTML */
         -moz-user-select: none; /* Firefox */
          -ms-user-select: none; /* Internet Explorer/Edge */
              user-select: none; /* Non-prefixed version, currently
                                    supported by Chrome and Opera */
  }

  textarea:focus, input:focus{
    outline: none;
  }

  *::-webkit-scrollbar {
    width: 4px;
  }

  *::-webkit-scrollbar-track {
    background: #999;
  }

  *::-webkit-scrollbar-thumb {
    background-color: #CCC;
    border-radius: 2px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: #EEE;
  }

  #kanban::-webkit-scrollbar {
    height: 8px;
    width: auto;
  }
  #kanban::-webkit-scrollbar-track {
    border-radius: 8px;
  }
  #kanban::-webkit-scrollbar-thumb {
    border-radius: 8px;
  }

  img.icon{
    height: 16px; /*24px*/
    width: 16px;
    padding: 8px;
  }

  img.icon.small{
    height: 16px;
    width: 16px;
    padding: 0 2px 0 0;
  }

  #app {
    height: calc(100%);
    width: calc(100%);
  }

  #wrapper {    
    height: calc(100%);
    width: calc(100%);

    overflow: hidden;

    position: relative;
    background-color: #333;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  /* ############################################################ MODAL */

  .modal {
    position: absolute;
    height: calc(100%);
    width: calc(100%);

    background-color: rgba(0,0,0,0.66);

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal .inner{
    height: calc(512px - 64px);
    width: calc(512px - 64px);
    background-color: #EEE;

    border-radius: 8px;
    overflow: auto;
    z-index: 2;
  }

  .modal .inner .title{
    width: calc(100% - 24px);
    padding: 8px 8px 8px 16px;
    background-color: #CCC;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal .inner .title > p{
    color: #333;
    font-weight: bold;
  }

  .modal .inner .title .button{
    height: 32px;
    width: 32px;
    background-color: #AAA;

    border-radius: 8px;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal .inner .title .button p{
    color: #333;
    font-size: 24px;
    line-height: 24px;
  }

  .modal .inner .title .button img{
    height: 16px;
    width: 16px;
  }

  .modal .segment {
    min-height: 32px;
    width: calc(100%);
    border-bottom: 1px solid #CCC;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .modal .segment:last-of-type {
    border-bottom: none;
  }

  .modal .segment.space {
    flex-direction: row;
    justify-content: space-between;
  }

  .modal .segment.right {
    align-items: flex-end;
  }

  .modal .segment input {
    height: calc(100%);
    width: calc(100% - 16px);
    padding: 8px;

    border: none;
    background-color: transparent;

    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: column;
  }

  .modal .segment > .button{
    margin: 8px;
    background-color: #CCC;
    border-radius: 8px;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal .segment > .button.secondary{
    background-color: transparent;
    border: 1px solid #CCC;
  }

  .modal .segment > .button img{
    height: 16px;
    width: 16px;
    padding: 8px;
    padding-right: 0px;
  }

  .modal .segment p{
    width: calc(100% - 16px);
    padding: 8px;
    color: #333;
  }

  .picker {
    width: auto;
    padding: 4px;
    margin-bottom: 8px;

    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;

    border: 1px solid #CCC;
    border-radius: 8px;

    cursor: pointer;
    overflow: hidden;
  }

  .picker .color { 
    height: 24px;
    width: 24px;
    margin-right: 4px;

    display: flex;
    justify-content: center;
    align-items: center;

    border-radius: 8px;
  }

  .picker .color:last-of-type{
    margin-right: 0;
  }

  .picker .color img{
    height: 16px;
    width: 16px;
    margin-left: 1px;
  }
  
  .picker .color.w  { background-color: rgba(255,255,255, 0.5) }
  .picker .color.gr { background-color: rgba(150,150,150, 0.5) }
  .picker .color.r  { background-color: rgba(210, 35, 43, 0.5) }
  .picker .color.ro { background-color: rgba(220, 69, 40, 0.5) }
  .picker .color.o  { background-color: rgba(243,112, 32, 0.5) }
  .picker .color.oy { background-color: rgba(227,142, 36, 0.5) }
  .picker .color.y  { background-color: rgba(243,224,  0, 0.5) }
  .picker .color.yg { background-color: rgba(142,198, 65, 0.5) }
  .picker .color.g  { background-color: rgba(  0,166, 82, 0.5) }
  .picker .color.bg { background-color: rgba( 84,192,177, 0.5) }
  .picker .color.b  { background-color: rgba( 56, 81,165, 0.5) }
  .picker .color.bv { background-color: rgba( 94, 82,164, 0.5) }
  .picker .color.v  { background-color: rgba(116, 77,160, 0.5) }
  .picker .color.vr { background-color: rgba(155, 76,157, 0.5) }

  /* ############################################################ TOP */

  #top {
    height: 48px;
    width: calc(100%);

    background-color: #666;
    overflow: hidden;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #defcon {
    height: calc(100%);
    width: calc(256px);

    background-color: #999;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #defcon .big{
    height: 48px;
    width: 48px;

    background-color: #AAA;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #defcon > p{
    width: calc(100% - 48px);
  }

  #debug {
    position: absolute;
    bottom: 8px;

    margin-right: 8px;
    padding: 8px;
    overflow: hidden;

    background-color: #999;
  }

  #top .button{
    height: 48px;
    width: 48px;

    cursor: pointer;
    background-color: #999;
    transition: background-color 0.3s ease 0s;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #top .button:hover{
    background-color: #AAA;
  }

  #top .button.trash {
    width: auto;
    background-color: #996666;
  }

  #top .button.trash:hover{
    background-color: #AA9999;
  }

  #top .button img {
    height: 24px;
    width: 24px;
  }

  /* ############################################################ MIDDLE */
  
  #middle {
    height: 100%;
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #projectlist{
    height: calc(100%);
    max-width: 256px;
    
    background-color: #999;
    margin-right: 8px;

    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
  }

  #projectlist > .title{
    height: 32px;
    width: 100%;

    background-color: #CCC;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #projectlist > .title p{
    color: #333;
    font-weight: bold;
    text-transform: capitalize;
  }

  #projectlist .project:last-of-type{
    border-bottom: none;
  }

  #projectlist .project{
    min-height: 32px;
    height: auto;
    width: calc(100%);

    background-color: #DDD;
    transition: background-color 0.3s ease 0s;

    display: flex;
    justify-content: space-between;
    align-items: center;
    /*flex-direction: column;*/
  }

  #projectlist .project:hover{
    cursor: pointer;
    background-color: #EEE;
  }

  #projectlist .project.selected{
    background-color: #EEE;
  }

  #projectlist .project.selected:hover{
    background-color: #FFF;
  }

  #projectlist .project .title {
    min-height: 32px;

    overflow: hidden;

    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
  }

  #projectlist .project .title p{
    color: #333;
    padding: 8px;
  }

  #projectlist .project .title input{
    width: calc(100% - 16px);
    padding: 8px;
    font-size: 16px;

    background-color: transparent;
    border: none;
  }

  #projectlist .project .footer {
    padding: 8px;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #projectlist .project .footer p{
    width: 100%;
    text-align: right;
    font-size: 10px;
    color: #999;
  }

  #projectlist .project input{
    width: calc(100% - 16px);
    padding: 8px;
    font-size: 16px;

    background-color: transparent;
    border: none;
  }

  #kanban {
    height: calc(100% - 16px);
    width: calc(100% - 16px);
    margin: 8px 0;

    border-radius: 0px;
    overflow: hidden;
    overflow-x: auto;

    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }

  #kanban .column{
    height: auto;
    min-width: 256px;
    max-width: 512px;
    width: 100%;
    
    border-radius: 8px;
    overflow: hidden;
    background-color: #AAA;
    margin-right: 8px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
  }

  #kanban .column:last-of-type{    
    border-right: none;
  }

  #kanban .column > .title{
    height: 32px;
    width: 100%;

    background-color: #CCC;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #kanban .column > .title p{
    margin: 8px;
    color: #333;
    font-weight: bold;
    text-transform: capitalize;
  }

  #kanban .column .button{
    height: 32px;
    width: 32px;

    transition: background-color 0.3s ease 0s;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #kanban .column .button:hover{
    background-color: rgba(0,0,0,0.1);
  }

  #kanban .column .button img{
    height: 16px;
    width: 16px;
  }

  #kanban .column .inner{
    height: calc(100% - 32px);
    width: 100%;
    padding: 0px;

    overflow: auto;

    display: flex;
    flex-direction: column;
  }

  #kanban .column .inner .list{
    padding: 8px;
  }

  #kanban .column .task{
    min-height: 64px;
    height: auto;
    width: calc(100%);
    margin-bottom: 4px;

    border-radius: 8px;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  #kanban .column .task .title {
    min-height: 32px;
    width: calc(100%);

    overflow: hidden;

    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  #kanban .column .task .title p{
    width: calc(100% - 16px);
    padding: 8px;
  }

  #kanban .column .task .title input{
    width: calc(100% - 16px);
    padding: 8px;
    font-size: 16px;

    background-color: transparent;
    border: none;
  }

  #kanban .column .task .footer {
    height: 16px;
    width: calc(100% - 16px);
    padding: 8px;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #kanban .column .task .footer p{
    text-align: right;
    font-size: 10px;
    color: #999;
  }

  #kanban .column .task .footer .segment {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #kanban .task    .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  /*#kanban .task.w  .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.gr .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.r  .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.ro .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.o  .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.oy .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.y  .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.yg .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.g  .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.bg .segment img { filter: invert(75%) brightness(50%) contrast(100%); }
  #kanban .task.b  .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.bv .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.v  .segment img { filter: invert(100%) brightness(100%) contrast(100%); }
  #kanban .task.vr .segment img { filter: invert(100%) brightness(100%) contrast(100%); }*/

  #kanban .column .task:last-of-type{
    margin-bottom: 0;
  }

  #kanban .column .task.target::before{
    content: "";
    height: 64px;
    width: calc(100% - 4px);
    border: 2px dashed #EEE;
    border-radius: 8px;
    margin: 0 0 8px 0;
  }

  #kanban .column .task > .inner{
    min-height: 32px;
    width: calc(100%);

    background-color: #EEE;

    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0px 8px 4px -8px;
    border-bottom: 2px solid #666;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #kanban .task.w  > .inner .title { background-color: rgba(200,200,200, 0.5) }
  #kanban .task.gr > .inner .title { background-color: rgba( 64, 64, 64, 0.5) }
  #kanban .task.r  > .inner .title { background-color: rgba(210, 35, 43, 0.5) }
  #kanban .task.ro > .inner .title { background-color: rgba(220, 69, 40, 0.5) }
  #kanban .task.o  > .inner .title { background-color: rgba(243,112, 32, 0.5) }
  #kanban .task.oy > .inner .title { background-color: rgba(227,142, 36, 0.5) }
  #kanban .task.y  > .inner .title { background-color: rgba(243,224,  0, 0.5) }
  #kanban .task.yg > .inner .title { background-color: rgba(142,198, 65, 0.5) }
  #kanban .task.g  > .inner .title { background-color: rgba(  0,166, 82, 0.5) }
  #kanban .task.bg > .inner .title { background-color: rgba( 84,192,177, 0.5) }
  #kanban .task.b  > .inner .title { background-color: rgba( 56, 81,165, 0.5) }
  #kanban .task.bv > .inner .title { background-color: rgba( 94, 82,164, 0.5) }
  #kanban .task.v  > .inner .title { background-color: rgba(116, 77,160, 0.5) }
  #kanban .task.vr > .inner .title { background-color: rgba(155, 76,157, 0.5) }

  #kanban .task    > .inner p { color: #333 }
  /*#kanban .task.w  > .inner .title p { color: #333 }
  #kanban .task.gr > .inner .title p { color: #EEE }
  #kanban .task.r  > .inner .title p { color: #EEE }
  #kanban .task.ro > .inner .title p { color: #EEE }
  #kanban .task.o  > .inner .title p { color: #333 }
  #kanban .task.oy > .inner .title p { color: #333 }
  #kanban .task.y  > .inner .title p { color: #333 }
  #kanban .task.yg > .inner .title p { color: #333 }
  #kanban .task.g  > .inner .title p { color: #EEE }
  #kanban .task.bg > .inner .title p { color: #333 }
  #kanban .task.b  > .inner .title p { color: #EEE }
  #kanban .task.bv > .inner .title p { color: #EEE }
  #kanban .task.v  > .inner .title p { color: #EEE }
  #kanban .task.vr > .inner .title p { color: #EEE }*/

  .subtasklist{
    width: 100%;
  }

  .subtask {
    min-height: 32px;
    width: calc(100%);

    transition: background-color 0.3s ease 0s;

    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .subtask.none p{
    color: #AAA !important;
    font-size: 12px;
  }

  .subtask:hover {
    background-color: #DDD;
  }

  .subtask img{
    height: 16px !important;
    width: 16px !important;
    padding: 8px !important;
  }

  .subtask p{
    width: calc(100% - 32px);
    padding-left: 0 !important;
  }

  .subtask input{
    width: calc(100% - 40px - 40px);
    padding: 8px;
    padding-left: 32px;
    font-size: 16px;

    background-color: transparent;
    border: none;
  }

  .subtask .checkbox {
    padding: 8px;

    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .subtask .checkbox.done{
    background-color: #666;
  }

  .subtask .button{
    height: 32px;
    width: 32px;

    transition: background-color 0.3s ease 0s;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .subtask .button:hover{
    background-color: rgba(0,0,0,0.1);
  }

  .subtask .button img{
    height: 16px;
    width: 16px;
  }

  .tags {
    width: calc(100% - 16px);
    padding: 8px;

    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .tags .tag {
    height: 16px;
    min-width: 16px;

    margin-right: 4px;
    margin-bottom: 4px;
    padding: 2px 8px;
    padding-right: 2px;

    font-family: sans-serif;
    font-size: 12px;

    overflow: hidden;
    border-radius: 8px;
    background-color: #CCC;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tags .tag .button{
    height: 100%;
    width: 16px;
    margin-left: 8px;

    background-color: #DDD;
    cursor: pointer;
    border-radius: 2px;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tags .tag img{
    height: 12px;
    width: 12px;
    padding: 2px;
  }

  .tags .tag input{
    height: 100%;
    width: 64px;
    padding: 2px;

    font-family: sans-serif;
    font-size: 12px;
  }

  /* ##################################################### DROPZONE */

  #kanban .column .dropzone{
    height: 100%;
    width: calc(100%);
    padding: 0px;

    overflow: hidden;

    flex-grow: 1;

    display: flex;
    justify-content: space-between;
    align-items: stretch;
    flex-direction: column;
  }

  #kanban .column .dropzone.target::after{
    content: "";
    height: 64px;
    width: calc(100% - 20px);
    border: 2px dashed #EEE;
    border-radius: 8px;
    margin: 0 0 0 8px;
  }

  #details {
    height: 100%;
    width: calc(128px);

    background-color: #666;
  }

  /* ############################################################ BOTTOM */
  
  #bottom {
    height: 32px;
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #taskNew{
    height: 32px;
    width: 100%;

    overflow: hidden;
    border-top: 1px solid #999;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #taskNew p{
    color: #999;
  }

  #taskNew input{
    height: calc(100% - 16px);
    width: calc(100% - 16px);
    padding: 8px;
    background-color: transparent;
    color: #999;
    border: none;
  }

  #taskNew input::placeholder{
    color: #999;
  }

  #kanbanNew{
    height: 32px;
    width: 100%;

    overflow: hidden;
    border-top: 1px solid #999;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #search {
    height: 100%;
    width: auto;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #search input {
    height: 16px;
    width: auto;
    margin: 8px;
    padding: 8px 16px;

    border-radius: 16px;
    background-color: #AAA;
    border: none;
  }

  #settings .item {
    min-height: 32px;
    width: calc(100%);

    transition: background-color 0.3s ease 0s;

    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  #settings .item:hover {
    background-color: #DDD;
  }

  #settings .item p{
    width: calc(100%);
    padding-left: 8px;
  }

  #settings .item input{
    width: calc(100% - 40px);
    padding: 8px;
    padding-left: 32px;
    font-size: 16px;

    background-color: transparent;
    border: none;
  }

  #settings .item .button{
    height: 32px;
    width: 32px;

    transition: background-color 0.3s ease 0s;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  #settings .item .button:hover{
    background-color: rgba(0,0,0,0.1);
  }

  #settings .item .button img{
    height: 16px;
    width: 16px;
  }
</style>
