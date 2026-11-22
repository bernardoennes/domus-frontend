import { readDatabase, updateDatabase } from '../lib/localDatabase.js'

const ANNOUNCEMENT_BODY_LIMIT = 400
const COMMENT_BODY_LIMIT = 200
const ANNOUNCEMENT_IMAGE_LIMIT = 1_400_000

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function assertAuthor(author, userId, contentLabel) {
  if (!userId || String(author?.id ?? '') !== String(userId)) {
    throw new Error(`Somente quem criou ${contentLabel} pode alterá-lo.`)
  }
}

function assertOrganisation(organisationId) {
  if (!organisationId) {
    throw new Error('Não foi possível identificar o condomínio dos avisos.')
  }
}

function updateAnnouncement(organisationId, announcementId, update) {
  assertOrganisation(organisationId)

  return updateDatabase((database) => {
    const index = database.announcements.findIndex((item) => (
      item.id === announcementId && String(item.organisationId) === String(organisationId)
    ))

    if (index < 0) {
      throw new Error('Este aviso não foi encontrado.')
    }

    const announcement = update(database.announcements[index])
    database.announcements[index] = announcement
    return announcement
  })
}

export async function fetchAnnouncements(organisationId) {
  assertOrganisation(organisationId)
  return readDatabase().announcements
    .filter((item) => String(item.organisationId) === String(organisationId))
    .sort((first, second) => (
      Number(second.pinned) - Number(first.pinned)
      || second.createdAt.localeCompare(first.createdAt)
    ))
}

export async function createAnnouncement(organisationId, values) {
  assertOrganisation(organisationId)
  const title = String(values.title ?? '').trim()
  const body = String(values.body ?? '').trim()

  if (!title || !body) {
    throw new Error('Informe o título e o conteúdo do aviso.')
  }
  if (body.length > ANNOUNCEMENT_BODY_LIMIT) {
    throw new Error(`O conteúdo do aviso deve ter no máximo ${ANNOUNCEMENT_BODY_LIMIT} caracteres.`)
  }

  const image = values.image ?? null
  if (image && (
    image.length > ANNOUNCEMENT_IMAGE_LIMIT
    || !/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(image)
  )) {
    throw new Error('A imagem do aviso não é válida ou excede o tamanho permitido.')
  }

  const announcement = {
    id: createId(),
    organisationId: String(organisationId),
    title,
    body,
    author: values.author,
    image,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    comments: [],
  }

  return updateDatabase((database) => {
    database.announcements.unshift(announcement)
    return announcement
  })
}

export async function setAnnouncementPinned(organisationId, announcementId, pinned) {
  return updateAnnouncement(organisationId, announcementId, (announcement) => ({
    ...announcement,
    pinned,
    updatedAt: new Date().toISOString(),
  }))
}

export async function updateAnnouncementContent(organisationId, announcementId, values, userId) {
  const title = String(values.title ?? '').trim()
  const body = String(values.body ?? '').trim()

  if (!title || !body) {
    throw new Error('Informe o título e o conteúdo do aviso.')
  }
  if (body.length > ANNOUNCEMENT_BODY_LIMIT) {
    throw new Error(`O conteúdo do aviso deve ter no máximo ${ANNOUNCEMENT_BODY_LIMIT} caracteres.`)
  }

  const image = values.image ?? null
  if (image && (
    image.length > ANNOUNCEMENT_IMAGE_LIMIT
    || !/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(image)
  )) {
    throw new Error('A imagem do aviso não é válida ou excede o tamanho permitido.')
  }

  return updateAnnouncement(organisationId, announcementId, (announcement) => {
    assertAuthor(announcement.author, userId, 'este aviso')

    return {
      ...announcement,
      title,
      body,
      image,
      updatedAt: new Date().toISOString(),
    }
  })
}

export async function deleteAnnouncement(organisationId, announcementId, userId) {
  assertOrganisation(organisationId)
  return updateDatabase((database) => {
    const index = database.announcements.findIndex((item) => (
      item.id === announcementId && String(item.organisationId) === String(organisationId)
    ))

    if (index < 0) {
      throw new Error('Este aviso não foi encontrado.')
    }
    assertAuthor(database.announcements[index].author, userId, 'este aviso')
    database.announcements.splice(index, 1)
  })
}

export async function addAnnouncementComment(organisationId, announcementId, values) {
  const body = String(values.body ?? '').trim()

  if (!body) {
    throw new Error('Escreva um comentário antes de enviar.')
  }
  if (body.length > COMMENT_BODY_LIMIT) {
    throw new Error(`O comentário deve ter no máximo ${COMMENT_BODY_LIMIT} caracteres.`)
  }

  return updateAnnouncement(organisationId, announcementId, (announcement) => {
    const parentExists = !values.parentId
      || announcement.comments.some((comment) => comment.id === values.parentId)

    if (!parentExists) {
      throw new Error('Não foi possível encontrar o comentário respondido.')
    }

    return {
      ...announcement,
      updatedAt: new Date().toISOString(),
      comments: [
        ...announcement.comments,
        {
          id: createId(),
          parentId: values.parentId ?? null,
          author: values.author,
          body,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  })
}

export async function updateAnnouncementComment(
  organisationId,
  announcementId,
  commentId,
  bodyValue,
  userId,
) {
  const body = String(bodyValue ?? '').trim()

  if (!body) {
    throw new Error('Escreva um comentário antes de salvar.')
  }
  if (body.length > COMMENT_BODY_LIMIT) {
    throw new Error(`O comentário deve ter no máximo ${COMMENT_BODY_LIMIT} caracteres.`)
  }

  return updateAnnouncement(organisationId, announcementId, (announcement) => {
    const target = announcement.comments.find((comment) => comment.id === commentId)
    if (!target) {
      throw new Error('Este comentário não foi encontrado.')
    }
    assertAuthor(target.author, userId, 'este comentário')

    return {
      ...announcement,
      updatedAt: new Date().toISOString(),
      comments: announcement.comments.map((comment) => (
        comment.id === commentId
          ? { ...comment, body, updatedAt: new Date().toISOString() }
          : comment
      )),
    }
  })
}

export async function deleteAnnouncementComment(
  organisationId,
  announcementId,
  commentId,
  userId,
) {
  return updateAnnouncement(organisationId, announcementId, (announcement) => {
    const target = announcement.comments.find((comment) => comment.id === commentId)
    if (!target) {
      throw new Error('Este comentário não foi encontrado.')
    }
    assertAuthor(target.author, userId, 'este comentário')

    const idsToDelete = new Set([commentId])
    let hasDescendants = true

    while (hasDescendants) {
      hasDescendants = false
      announcement.comments.forEach((comment) => {
        if (comment.parentId && idsToDelete.has(comment.parentId) && !idsToDelete.has(comment.id)) {
          idsToDelete.add(comment.id)
          hasDescendants = true
        }
      })
    }

    return {
      ...announcement,
      updatedAt: new Date().toISOString(),
      comments: announcement.comments.filter((comment) => !idsToDelete.has(comment.id)),
    }
  })
}
