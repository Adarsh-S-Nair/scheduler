# MultiStepModal Usage Examples

## Single-Step Modal

```jsx
import MultiStepModal from './components/MultiStepModal'

const [isOpen, setIsOpen] = useState(false)

const steps = [
  {
    title: 'Confirm Delete',
    content: <p>Are you sure you want to delete this item?</p>,
    primaryButton: {
      text: 'Delete',
      variant: 'danger',
      onClick: () => {
        handleDelete()
        setIsOpen(false)
      }
    },
    secondaryButton: {
      text: 'Cancel',
      onClick: () => setIsOpen(false)
    }
  }
]

<MultiStepModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  steps={steps}
/>
```

## Two-Step Modal

```jsx
const steps = [
  {
    title: 'Step 1: Choose Option',
    content: <OptionsSelector />,
    primaryButton: {
      text: 'Next',
      disabled: !hasSelection
    }
  },
  {
    title: 'Step 2: Confirm',
    content: <ConfirmationView />,
    primaryButton: {
      text: 'Submit',
      onClick: handleSubmit
    }
  }
]

<MultiStepModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  steps={steps}
/>
```

## Dynamic Steps (Conditional)

```jsx
const steps = useMemo(() => {
  const baseSteps = [
    {
      title: 'Select Item',
      content: <ItemSelector />
    }
  ]

  // Only add config step if needed
  if (needsConfiguration) {
    baseSteps.push({
      title: 'Configure Settings',
      content: <ConfigForm />
    })
  }

  // Always add confirmation
  baseSteps.push({
    title: 'Review & Confirm',
    content: <ReviewStep />
  })

  return baseSteps
}, [needsConfiguration])
```

## Custom Footer

```jsx
{
  title: 'Advanced Options',
  content: <AdvancedForm />,
  customFooter: (
    <>
      <Button onClick={handleReset}>Reset</Button>
      <div style={{ flex: 1 }} />
      <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  )
}
```

## With Lifecycle Hooks

```jsx
{
  title: 'Data Entry',
  content: <DataForm />,
  onEnter: () => {
    console.log('Entered data entry step')
    loadInitialData()
  },
  onLeave: () => {
    console.log('Leaving data entry step')
    saveProgress()
  }
}
```

## Form Submission Pattern

```jsx
{
  title: 'User Information',
  content: <UserForm onSubmit={handleUserSubmit} />,
  primaryButton: {
    text: 'Save & Continue',
    onClick: () => {
      // Programmatically trigger form submit
      const form = document.querySelector('.user-form')
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  }
}
```

## Props Reference

### MultiStepModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | required | Controls modal visibility |
| `onClose` | function | required | Called when modal closes |
| `steps` | array | required | Array of step configurations |
| `initialStep` | number | 0 | Starting step index |
| `size` | string | 'md' | Modal size (sm, md, lg, xl) |

### Step Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Step title shown in header |
| `content` | ReactNode | Yes | Step content/component |
| `primaryButton` | object | No | Primary button config |
| `secondaryButton` | object | No | Secondary button config |
| `customFooter` | ReactNode | No | Custom footer (overrides buttons) |
| `hideCloseButton` | boolean | No | Hide X close button |
| `onEnter` | function | No | Called when entering step |
| `onLeave` | function | No | Called when leaving step |

### Button Configuration

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Button text |
| `variant` | string | Button variant (primary, secondary, danger, etc) |
| `onClick` | function | Click handler |
| `disabled` | boolean | Disable button |
| `size` | string | Button size |
